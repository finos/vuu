import { vi } from "vitest";

export const FROZEN_TIME = new Date("2025-01-01T09:00:00.000Z").getTime();

/**
 * Viewport throttles a run of size-only updates only when time passes between
 * them (see Viewport.shouldThrottleMessage). With a real clock that depends on
 * whether the millisecond ticks over between two messages, so a test could
 * pass or fail with machine speed. This stubs Date.now to return FROZEN_TIME;
 * a test that wants throttling moves the clock itself with fake timers or
 * vi.setSystemTime. A test that already installed fake timers keeps its clock.
 */
export const freezeClock = () => {
  if (!vi.isFakeTimers()) {
    vi.spyOn(Date, "now").mockReturnValue(FROZEN_TIME);
  }
};
