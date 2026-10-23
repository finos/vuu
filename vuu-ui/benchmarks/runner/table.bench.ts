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
  DataSourceKind,
  RunOptions,
  Scenario,
  ScenarioResult,
} from "../harness/types";
import { startMockVuuServer } from "./mock-vuu-server";
import { SCENARIOS, TABLE_LAYOUT, VIEWPORT } from "./scenarios";
import { serveDirectory } from "./static-server";
import { summarise } from "./summary";
import { WorkerProbe } from "./worker-probe";

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

/**
 * BENCH_TARGETS="base=../base/vuu-ui/benchmarks/dist,pr=benchmarks/dist"
 * A dist folder with an @local or @remote suffix runs every scenario on that
 * data source, e.g. "local=benchmarks/dist@local,remote=benchmarks/dist@remote"
 * compares the two data paths of one build.
 */
const TARGETS = (env.BENCH_TARGETS ?? "current=benchmarks/dist")
  .split(",")
  .map((spec) => {
    const [label, target] = spec.split("=");
    const [dir, source] = target.trim().split("@");
    if (source !== undefined && source !== "local" && source !== "remote") {
      throw Error(`[benchmarks] unknown data source @${source} in ${spec}`);
    }
    return {
      label: label.trim(),
      dir: resolve(dir),
      source: source as DataSourceKind | undefined,
    };
  });

const forTarget = (scenario: Scenario, source?: DataSourceKind): Scenario =>
  source ? { ...scenario, dataset: { ...scenario.dataset, source } } : scenario;

// targets that set the data source run the scenarios that leave it open,
// not their -remote twins
const sourceOverride = TARGETS.some(({ source }) => source !== undefined);
const selected = SCENARIOS.filter(
  ({ id, dataset }) =>
    (!SCENARIO_FILTER ||
      SCENARIO_FILTER.some((filter) => id.startsWith(filter))) &&
    !(sourceOverride && dataset.source !== undefined),
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
  worker: WorkerProbe;
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
  const worker = new WorkerProbe(cdp);
  await worker.attach();
  return { context, page, cdp, worker };
};

const measure = async (
  { page, cdp, worker }: Session,
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
  // the worker's CPU profile is part of the instrumented pass only, so that
  // profiling does not slow the worker in the timing pass
  const profileWorker = options.instrument && worker.attached;
  if (profileWorker) await worker.startProfile();
  const before = await getMetrics(cdp);
  const result = await page.evaluate(([s, o]) => window.__vuuBench.run(s, o), [
    scenario,
    options,
  ] as const);
  const workerCpuMs = profileWorker ? await worker.stopProfile() : undefined;
  await afterRun?.();
  const cdp_ = await cdpStats(cdp, before);
  const workerStats = await worker.stats(workerCpuMs);
  return {
    schemaVersion: 1,
    scenarioId: scenario.id,
    pass,
    iteration,
    startedAt,
    mount,
    result,
    cdp: cdp_,
    ...(workerStats ? { worker: workerStats } : undefined),
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
    source?: DataSourceKind;
    close: () => Promise<void>;
  }>;
  let vuuServer: Awaited<ReturnType<typeof startMockVuuServer>>;

  test.beforeAll(async () => {
    vuuServer = await startMockVuuServer();
    servers = await Promise.all(
      TARGETS.map(async ({ label, dir, source }) => {
        const server = await serveDirectory(dir);
        const url = `${server.url}?vuuServer=${encodeURIComponent(vuuServer.url)}`;
        return { label, source, url, close: server.close };
      }),
    );
  });

  test.afterAll(async () => {
    await Promise.all(servers.map((s) => s.close()));
    await vuuServer.close();
  });

  for (const baseScenario of selected) {
    test(baseScenario.id, async ({ browser }) => {
      if (
        servers.some(
          (s) => forTarget(baseScenario, s.source).dataset.source === "remote",
        )
      ) {
        vuuServer.prepare(baseScenario.dataset);
      }
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
              forTarget(baseScenario, server.source),
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
        const scenario = forTarget(baseScenario, server.source);
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
