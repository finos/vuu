export function invariant(condition, message) {
  if (!condition) {
    const error = new Error(message);
    error.name = 'Invariant Violation';
    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
}
