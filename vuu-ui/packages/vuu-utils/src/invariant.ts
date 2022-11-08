export function invariant(condition: boolean, message: string) {
  if (!condition) {
    const error = new Error(message);
    error.name = 'Invariant Violation';
    // TODO what is framesToPop?
    // @ts-ignore
    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
}
