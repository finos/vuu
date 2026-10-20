import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import { join, resolve } from "node:path";
import {
  type Browser,
  type BrowserContext,
  type CDPSession,
  type Page,
  test,
} from "@playwright/test";
import type {
  BenchEnv,
  BenchRun,
  CdpStats,
  RunOptions,
  Scenario,
  ScenarioResult,
} from "../harness/types";
import { SCENARIOS, TABLE_LAYOUT, VIEWPORT } from "./scenarios";
import { serveDirectory } from "./static-server";
import { summarise } from "./summary";

/**
 * Runs each scenario against one or more built benchmark apps (targets).
 * With two targets, iterations are interleaved (A B B A A B ...) so that
 * drift in machine performance affects both equally.
 */
const env = process.env;
const ITERATIONS = Number(env.BENCH_ITERATIONS ?? 5);
const CPU_THROTTLE = Number(env.BENCH_CPU_THROTTLE ?? 4);
const DPR = Number(env.BENCH_DPR ?? 1);
const TRACE = env.BENCH_TRACE === "1";
const KEEP_SAMPLES = env.BENCH_SAMPLES === "1";
const RESULTS_DIR = resolve(env.BENCH_RESULTS ?? "benchmarks/results");
const SCENARIO_FILTER = env.BENCH_SCENARIOS?.split(",").map((s) => s.trim());

/** BENCH_TARGETS="base=../base/vuu-ui/benchmarks/dist,pr=benchmarks/dist" */
const TARGETS = (env.BENCH_TARGETS ?? "current=benchmarks/dist")
  .split(",")
  .map((spec) => {
    const [label, dir] = spec.split("=");
    return { label: label.trim(), dir: resolve(dir.trim()) };
  });

const selected = SCENARIOS.filter(
  ({ id }) =>
    !SCENARIO_FILTER || SCENARIO_FILTER.some((filter) => id.startsWith(filter)),
);

const CDP_METRICS = {
  LayoutCount: "layoutCount",
  LayoutDuration: "layoutMs",
  RecalcStyleCount: "recalcStyleCount",
  RecalcStyleDuration: "recalcStyleMs",
  ScriptDuration: "scriptMs",
  TaskDuration: "taskMs",
} as const;

const getMetrics = async (cdp: CDPSession) => {
  const { metrics } = await cdp.send("Performance.getMetrics");
  return Object.fromEntries(metrics.map((m) => [m.name, m.value]));
};

const cdpStats = async (
  cdp: CDPSession,
  before: Record<string, number>,
): Promise<CdpStats> => {
  const after = await getMetrics(cdp);
  const stats = {} as CdpStats;
  for (const [name, key] of Object.entries(CDP_METRICS)) {
    const delta = (after[name] ?? 0) - (before[name] ?? 0);
    // CDP reports durations in seconds
    stats[key] = Math.round(name.endsWith("Duration") ? delta * 1000 : delta);
  }
  // retained heap and DOM after a full GC
  await cdp.send("HeapProfiler.collectGarbage");
  const settled = await getMetrics(cdp);
  const counters = await cdp.send("Memory.getDOMCounters");
  stats.jsHeapUsedMB =
    Math.round(((settled.JSHeapUsedSize ?? 0) / 1024 / 1024) * 10) / 10;
  stats.domNodes = counters.nodes;
  stats.jsEventListeners = counters.jsEventListeners;
  return stats;
};

interface Session {
  context: BrowserContext;
  page: Page;
  cdp: CDPSession;
}

const openSession = async (browser: Browser, url: string): Promise<Session> => {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DPR,
  });
  const page = await context.newPage();
  page.on("pageerror", (err) => console.error(`[page error] ${err.message}`));
  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");
  await page.goto(url);
  await page.waitForFunction(() => window.__vuuBench !== undefined);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLE });
  return { context, page, cdp };
};

const measure = async (
  { page, cdp }: Session,
  scenario: Scenario,
  options: RunOptions,
  pass: BenchRun["pass"],
  iteration: number,
  beforeRun?: () => Promise<void>,
  afterRun?: () => Promise<void>,
): Promise<BenchRun> => {
  const startedAt = new Date().toISOString();
  const mount = await page.evaluate(
    ([s, layout]) => window.__vuuBench.mount(s, layout),
    [scenario, TABLE_LAYOUT] as const,
  );
  // warm-up run, so the measured run is not dominated by first-run JIT
  // compilation. Load is measured by mount and needs no warm-up.
  if (scenario.run.kind !== "load") {
    await page.evaluate(
      (s) =>
        window.__vuuBench.run(s, { instrument: false, keepSamples: false }),
      scenario,
    );
  }
  await beforeRun?.();
  const before = await getMetrics(cdp);
  const result = await page.evaluate(([s, o]) => window.__vuuBench.run(s, o), [
    scenario,
    options,
  ] as const);
  await afterRun?.();
  const cdp_ = await cdpStats(cdp, before);
  return {
    schemaVersion: 1,
    scenarioId: scenario.id,
    pass,
    iteration,
    startedAt,
    mount,
    result,
    cdp: cdp_,
  };
};

const describeEnv = async (
  browser: Browser,
  session: Session,
  label: string,
): Promise<BenchEnv> => {
  const build = await session.page.evaluate(() => window.__vuuBench.build);
  return {
    gitSha: build.gitSha,
    target: label,
    buildMode: build.mode,
    browser: browser.browserType().name(),
    browserVersion: browser.version(),
    headless: env.BENCH_HEADED !== "1",
    gpu: env.BENCH_GPU === "off" ? "off" : "on",
    cpuThrottle: CPU_THROTTLE,
    viewport: [VIEWPORT.width, VIEWPORT.height],
    devicePixelRatio: DPR,
    hardwareConcurrency: os.cpus().length,
    platform: `${os.platform()} ${os.arch()}`,
    machineId: env.BENCH_MACHINE_ID,
  };
};

test.describe("Vuu Table benchmarks", () => {
  let servers: Array<{
    label: string;
    url: string;
    close: () => Promise<void>;
  }>;

  test.beforeAll(async () => {
    servers = await Promise.all(
      TARGETS.map(async ({ label, dir }) => ({
        label,
        ...(await serveDirectory(dir)),
      })),
    );
  });

  test.afterAll(async () => {
    await Promise.all(servers.map((s) => s.close()));
  });

  for (const scenario of selected) {
    test(scenario.id, async ({ browser }) => {
      const runs = new Map<string, BenchRun[]>(
        servers.map((s) => [s.label, []]),
      );
      const envs = new Map<string, BenchEnv>();

      for (let i = 0; i < ITERATIONS; i++) {
        const order = i % 2 === 0 ? servers : [...servers].reverse();
        for (const server of order) {
          const session = await openSession(browser, server.url);
          try {
            if (!envs.has(server.label)) {
              envs.set(
                server.label,
                await describeEnv(browser, session, server.label),
              );
            }
            const run = await measure(
              session,
              scenario,
              { instrument: false, keepSamples: KEEP_SAMPLES },
              "timing",
              i,
            );
            runs.get(server.label)?.push(run);
          } finally {
            await session.context.close();
          }
        }
      }

      for (const server of servers) {
        const session = await openSession(browser, server.url);
        const tracePath = join(
          RESULTS_DIR,
          server.label,
          "traces",
          `${scenario.id}.json`,
        );
        try {
          if (TRACE) await mkdir(join(tracePath, ".."), { recursive: true });
          const run = await measure(
            session,
            scenario,
            { instrument: true, keepSamples: false },
            "instrumented",
            0,
            TRACE
              ? () =>
                  browser.startTracing(session.page, {
                    path: tracePath,
                    screenshots: false,
                  })
              : undefined,
            TRACE
              ? async () => {
                  await browser.stopTracing();
                }
              : undefined,
          );
          runs.get(server.label)?.push(run);
        } finally {
          await session.context.close();
        }

        const serverRuns = runs.get(server.label) ?? [];
        const envInfo = envs.get(server.label);
        if (!envInfo) throw Error(`no environment for ${server.label}`);
        const record: ScenarioResult = {
          schemaVersion: 1,
          scenario,
          env: envInfo,
          runs: serverRuns,
          summary: summarise(serverRuns),
        };
        const dir = join(RESULTS_DIR, server.label);
        await mkdir(dir, { recursive: true });
        await writeFile(
          join(dir, `${scenario.id}.json`),
          JSON.stringify(record, null, 2),
        );
        if (envInfo.buildMode !== "production") {
          console.warn(
            `[benchmarks] ${server.label} is a development build, timings are not representative`,
          );
        }
        console.log(
          "%s [%s] %s",
          scenario.id,
          server.label,
          JSON.stringify(record.summary),
        );
      }
    });
  }
});
