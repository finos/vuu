export const errorMessage = (cause: unknown) =>
  cause instanceof Error
    ? cause.message
    : typeof cause === "string"
      ? cause
      : "Unexpected error";
