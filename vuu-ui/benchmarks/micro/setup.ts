// ArrayDataSource schedules page-count events with requestAnimationFrame,
// which node does not have
globalThis.requestAnimationFrame ??= (callback) =>
  setTimeout(() => callback(performance.now()), 0) as unknown as number;
