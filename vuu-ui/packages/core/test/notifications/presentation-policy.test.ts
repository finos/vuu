import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PortalNotification } from "../../src/notifications/notification-types";
import {
  defaultPresentationPolicy,
  type PresentationContext,
  ToastRateLimiter,
} from "../../src/notifications/presentation-policy";

const notification = (
  overrides: Partial<PortalNotification> & {
    moduleIds?: string[];
    source?: "server" | "client";
  } = {},
): PortalNotification => {
  const { moduleIds = ["a"], source = "server", ...rest } = overrides;
  return {
    attributes: {},
    createdAt: 1,
    expired: false,
    id: "1",
    initial: false,
    key: "s1:1",
    kind: "toast",
    level: "info",
    message: "",
    origin: { connectionId: "s1", moduleIds, source },
    read: false,
    receivedAt: 1,
    title: "t",
    ...rest,
  };
};

const context = (
  overrides: Partial<PresentationContext> = {},
): PresentationContext => ({
  activeModuleId: "a",
  doNotDisturb: false,
  documentVisible: true,
  panelOpen: false,
  ...overrides,
});

describe("defaultPresentationPolicy", () => {
  const policy = defaultPresentationPolicy;

  it("toasts server notifications for the active module only", () => {
    expect(policy(notification(), context())).toBe("toast");
    expect(policy(notification({ moduleIds: ["b"] }), context())).toBe("none");
    expect(policy(notification({ moduleIds: [] }), context())).toBe("none");
  });

  it("shows banners from any server or module, including the snapshot", () => {
    const banner = notification({
      initial: true,
      kind: "banner",
      moduleIds: ["b"],
    });
    expect(policy(banner, context())).toBe("banner");
    expect(policy(banner, context({ panelOpen: true }))).toBe("banner");
  });

  it("shows nothing for expired, silent or snapshot toasts, or in do not disturb", () => {
    expect(policy(notification({ expired: true }), context())).toBe("none");
    expect(policy(notification({ kind: "silent" }), context())).toBe("none");
    expect(policy(notification({ initial: true }), context())).toBe("none");
    expect(
      policy(notification({ kind: "banner" }), context({ doNotDisturb: true })),
    ).toBe("none");
  });

  it("does not toast server notifications while the panel is open", () => {
    expect(policy(notification(), context({ panelOpen: true }))).toBe("none");
  });

  it("shows client notifications from the active module or the portal", () => {
    const client = (moduleIds: string[]) =>
      notification({ moduleIds, source: "client" });
    expect(policy(client(["a"]), context())).toBe("toast");
    expect(policy(client([]), context())).toBe("toast");
    expect(policy(client(["b"]), context())).toBe("none");
    expect(policy(client(["a"]), context({ panelOpen: true }))).toBe("toast");
  });
});

describe("ToastRateLimiter", () => {
  let time = 0;
  let nextId = 0;
  let shown: string[];
  let hidden: string[];
  let summaries: [string, number][];
  let limiter: ToastRateLimiter<string>;

  beforeEach(() => {
    vi.useFakeTimers();
    time = 0;
    shown = [];
    hidden = [];
    summaries = [];
    limiter = new ToastRateLimiter<string>({
      hide: (id) => hidden.push(id),
      now: () => time,
      show: (item) => {
        shown.push(item);
        return `id${nextId++}`;
      },
      showSummary: (source, count) => {
        summaries.push([source, count]);
        return `id${nextId++}`;
      },
    });
    nextId = 0;
  });

  afterEach(() => {
    limiter.dispose();
    vi.useRealTimers();
  });

  it("hides the oldest toast to keep at most three visible", () => {
    for (const item of ["a", "b", "c", "d"]) {
      limiter.present(item, `source-${item}`);
      time += 100;
    }
    expect(shown).toEqual(["a", "b", "c", "d"]);
    expect(hidden).toEqual(["id0"]);
  });

  it("does not hide toasts that have already gone", () => {
    limiter.present("a", "s");
    limiter.present("b", "s");
    limiter.present("c", "s");
    time += 10_000;
    limiter.present("d", "s");
    expect(hidden).toEqual([]);
  });

  it("summarises a burst from one source once it ends", () => {
    for (let i = 0; i < 8; i++) {
      limiter.present(`n${i}`, "s1");
      time += 100;
      vi.advanceTimersByTime(100);
    }
    limiter.present("other", "s2");
    expect(shown).toEqual(["n0", "n1", "n2", "n3", "n4", "other"]);
    expect(summaries).toEqual([]);

    time += 2000;
    vi.advanceTimersByTime(2000);
    expect(summaries).toEqual([["s1", 3]]);

    time += 5000;
    limiter.present("later", "s1");
    expect(shown.at(-1)).toBe("later");
  });
});
