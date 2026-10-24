/** The edit operation that failed, passed to an `EditErrorHandler`. */
export type EditOperation = "begin" | "cancel" | "delete" | "save";

/**
 * Called when an edit session operation fails. When no handler is supplied,
 * hooks log the error to the console.
 */
export type EditErrorHandler = (error: Error, operation: EditOperation) => void;

export const toError = (cause: unknown) =>
  cause instanceof Error ? cause : new Error(String(cause));

export const reportEditError = (
  source: string,
  onError: EditErrorHandler | undefined,
  cause: unknown,
  operation: EditOperation,
) => {
  const error = toError(cause);
  if (onError) {
    onError(error, operation);
  } else {
    console.error(`[${source}] ${operation} edit session failed`, error);
  }
};
