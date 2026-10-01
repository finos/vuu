export interface FrameMetrics {
  longTaskCount: number;
  /** sum of (duration - 50ms) across long tasks - a standard "jank" proxy */
  totalBlockingTimeMs: number;
  maxTaskDurationMs: number;
}

export interface FrameMetricsRecorder {
  getMetrics: () => FrameMetrics;
  reset: () => void;
  disconnect: () => void;
}

/**
 * Tracks main-thread long tasks (>50ms) via PerformanceObserver. This is the
 * standard "is the UI thread blocked" signal, and works identically whether
 * the blocking work is VUU's render cycle or ag-grid's.
 * Chromium-only API - callers should treat all-zero metrics as "unsupported"
 * on other browsers, not "no jank".
 */
export function createFrameMetricsRecorder(): FrameMetricsRecorder {
  let longTaskCount = 0;
  let totalBlockingTimeMs = 0;
  let maxTaskDurationMs = 0;

  let observer: PerformanceObserver | undefined;
  try {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        longTaskCount += 1;
        totalBlockingTimeMs += Math.max(0, entry.duration - 50);
        maxTaskDurationMs = Math.max(maxTaskDurationMs, entry.duration);
      }
    });
    observer.observe({ type: "longtask", buffered: true });
  } catch {
    // longtask API not supported in this browser; metrics remain at zero
  }

  return {
    getMetrics: () => ({ longTaskCount, totalBlockingTimeMs, maxTaskDurationMs }),
    reset: () => {
      longTaskCount = 0;
      totalBlockingTimeMs = 0;
      maxTaskDurationMs = 0;
    },
    disconnect: () => observer?.disconnect(),
  };
}

export interface FpsResult {
  frames: number;
  durationMs: number;
  fps: number;
}

export interface FpsCounter {
  start: () => void;
  stop: () => FpsResult;
}

export function createFpsCounter(): FpsCounter {
  let frames = 0;
  let running = false;
  let rafId = 0;
  let startTime = 0;

  const loop = () => {
    frames += 1;
    if (running) {
      rafId = requestAnimationFrame(loop);
    }
  };

  return {
    start() {
      frames = 0;
      running = true;
      startTime = performance.now();
      rafId = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
      const durationMs = performance.now() - startTime;
      return { frames, durationMs, fps: durationMs > 0 ? (frames / durationMs) * 1000 : 0 };
    },
  };
}
