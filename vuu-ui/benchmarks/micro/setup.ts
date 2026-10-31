// ArrayDataSource schedules page-count events with requestAnimationFrame,
// which node does not have
globalThis.requestAnimationFrame ??= (callback) =>
  setTimeout(() => callback(performance.now()), 0) as unknown as number;

// vuu-utils logging reads this global; "error" matches a production build
// and keeps debug and info logging out of the measurements
(globalThis as { loggingSettings?: object }).loggingSettings ??= {
  loggingLevel: "error",
};

// Viewport clears its size-only throttle timer with self.clearTimeout
(globalThis as { self?: unknown }).self ??= globalThis;
