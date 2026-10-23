import type { CDPSession } from "@playwright/test";
import type { WorkerStats } from "../harness/types";

interface ProfileNode {
  id: number;
  callFrame: { functionName: string };
}

interface Profile {
  nodes: ProfileNode[];
  samples?: number[];
  timeDeltas?: number[];
}

/**
 * Reads CPU and heap figures from the page's dedicated worker (the remote
 * data source's worker) over CDP. Workers have no Performance domain, so CPU
 * time comes from a sampling profile. Uses Target.setAutoAttach without
 * flattened sessions, messages go through Target.sendMessageToTarget, which
 * works on the page's CDPSession.
 */
export class WorkerProbe {
  #cdp: CDPSession;
  #sessionId: string | undefined;
  #nextId = 1;
  #pending = new Map<number, (message: Record<string, unknown>) => void>();

  constructor(cdp: CDPSession) {
    this.#cdp = cdp;
    cdp.on("Target.attachedToTarget", ({ sessionId, targetInfo }) => {
      if (targetInfo.type === "worker") this.#sessionId = sessionId;
    });
    cdp.on("Target.detachedFromTarget", ({ sessionId }) => {
      if (sessionId === this.#sessionId) this.#sessionId = undefined;
    });
    cdp.on("Target.receivedMessageFromTarget", ({ message }) => {
      const parsed = JSON.parse(message);
      if (typeof parsed.id === "number") {
        this.#pending.get(parsed.id)?.(parsed);
        this.#pending.delete(parsed.id);
      }
    });
  }

  async attach() {
    await this.#cdp.send("Target.setAutoAttach", {
      autoAttach: true,
      waitForDebuggerOnStart: false,
      flatten: false,
    });
  }

  get attached() {
    return this.#sessionId !== undefined;
  }

  async #send<T>(method: string, params: object = {}) {
    const sessionId = this.#sessionId;
    if (!sessionId) throw Error("[benchmarks] no worker attached");
    const id = this.#nextId++;
    const response = new Promise<Record<string, unknown>>((resolve) =>
      this.#pending.set(id, resolve),
    );
    await this.#cdp.send("Target.sendMessageToTarget", {
      sessionId,
      message: JSON.stringify({ id, method, params }),
    });
    const message = await response;
    if (message.error) {
      throw Error(
        `[benchmarks] worker ${method}: ${JSON.stringify(message.error)}`,
      );
    }
    return message.result as T;
  }

  async startProfile() {
    await this.#send("Profiler.enable");
    await this.#send("Profiler.start");
  }

  /** Busy time, all samples except (idle), since startProfile */
  async stopProfile() {
    const { profile } = await this.#send<{ profile: Profile }>("Profiler.stop");
    await this.#send("Profiler.disable");
    const idle = new Set(
      profile.nodes
        .filter((n) => n.callFrame.functionName === "(idle)")
        .map((n) => n.id),
    );
    const samples = profile.samples ?? [];
    const deltas = profile.timeDeltas ?? [];
    let busyMicros = 0;
    for (let i = 0; i < samples.length; i++) {
      if (!idle.has(samples[i])) busyMicros += deltas[i] ?? 0;
    }
    return Math.round(busyMicros / 1000);
  }

  async heapUsedMB() {
    await this.#send("HeapProfiler.collectGarbage");
    const { usedSize } = await this.#send<{ usedSize: number }>(
      "Runtime.getHeapUsage",
    );
    return Math.round((usedSize / 1024 / 1024) * 10) / 10;
  }

  async stats(cpuMs?: number): Promise<WorkerStats | undefined> {
    if (!this.attached) return undefined;
    return { cpuMs, jsHeapUsedMB: await this.heapUsedMB() };
  }
}
