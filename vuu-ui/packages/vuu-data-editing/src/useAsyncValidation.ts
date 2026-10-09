import { useCallback, useEffect, useRef, useState } from "react";

export type AsyncValidationStatus = "idle" | "validating" | "valid" | "invalid";

/** Resolves to an error message, or undefined when the value is valid. */
export type AsyncValidator<T> = (
  value: T,
  signal: AbortSignal,
) => Promise<string | undefined>;

export interface AsyncValidationHookProps<T> {
  validator: AsyncValidator<T>;
  /** Wait this long after the last call before validating. @default 300 */
  debounceMs?: number;
  /** Converts a value to a cache key. @default String */
  cacheKey?: (value: T) => string;
}

interface ValidationState {
  error?: string;
  status: AsyncValidationStatus;
}

const IDLE: ValidationState = { status: "idle" };

/**
 * Runs an async check (e.g. "is this name already taken?" via RPC) with
 * debouncing, caching, and protection against stale results. Only the most
 * recent call updates `status`/`error`; earlier in-flight checks are aborted.
 *
 * `validate` resolves to the error message (or undefined), so it can also be
 * awaited before submitting. A call superseded by a later call resolves to
 * undefined; callers that await should check `status` of the latest call.
 */
export const useAsyncValidation = <T>({
  cacheKey = String,
  debounceMs = 300,
  validator,
}: AsyncValidationHookProps<T>) => {
  const [state, setState] = useState<ValidationState>(IDLE);
  const cacheRef = useRef(new Map<string, string | undefined>());
  const latestRef = useRef(0);
  const abortRef = useRef<AbortController | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingResolveRef = useRef<
    ((error: string | undefined) => void) | undefined
  >(undefined);
  const validatorRef = useRef(validator);
  validatorRef.current = validator;

  const cancelPending = useCallback(() => {
    clearTimeout(timerRef.current);
    abortRef.current?.abort();
    abortRef.current = undefined;
    pendingResolveRef.current?.(undefined);
    pendingResolveRef.current = undefined;
  }, []);

  useEffect(() => cancelPending, [cancelPending]);

  const validate = useCallback(
    (value: T, { immediate = false } = {}): Promise<string | undefined> => {
      const callId = ++latestRef.current;
      cancelPending();
      const key = cacheKey(value);
      const cache = cacheRef.current;
      if (cache.has(key)) {
        const error = cache.get(key);
        setState({ error, status: error ? "invalid" : "valid" });
        return Promise.resolve(error);
      }
      setState({ status: "validating" });

      return new Promise((resolvePromise) => {
        const resolve = (error: string | undefined) => {
          if (pendingResolveRef.current === resolve) {
            pendingResolveRef.current = undefined;
          }
          resolvePromise(error);
        };
        pendingResolveRef.current = resolve;
        const run = async () => {
          const controller = new AbortController();
          abortRef.current = controller;
          try {
            const error = await validatorRef.current(value, controller.signal);
            cache.set(key, error);
            if (callId === latestRef.current) {
              setState({ error, status: error ? "invalid" : "valid" });
            }
            resolve(error);
          } catch (cause) {
            const error =
              cause instanceof Error ? cause.message : String(cause);
            if (controller.signal.aborted) {
              resolve(undefined);
            } else {
              if (callId === latestRef.current) {
                setState({ error, status: "invalid" });
              }
              resolve(error);
            }
          }
        };
        if (immediate || debounceMs <= 0) {
          run();
        } else {
          timerRef.current = setTimeout(run, debounceMs);
        }
      });
    },
    [cacheKey, cancelPending, debounceMs],
  );

  /** Cancels any pending check and returns to the idle state. */
  const reset = useCallback(() => {
    latestRef.current += 1;
    cancelPending();
    setState(IDLE);
  }, [cancelPending]);

  /** Clears cached results, e.g. after saving changes the valid values. */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return { ...state, clearCache, reset, validate };
};
