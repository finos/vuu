import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type DraftValues = Record<string, unknown>;
export type DraftErrors<T extends DraftValues> = Partial<
  Record<keyof T & string, string>
>;

export interface EntityDraftHookProps<T extends DraftValues> {
  /**
   * The saved entity. The draft resets whenever this changes (by reference),
   * so pass a stable value.
   */
  initialValues: T;
  /** Synchronous validation, run on every change. */
  validate?: (values: T) => DraftErrors<T> | undefined;
  /**
   * Saves the draft, e.g. via an RPC call. Receives the full values and just
   * the changed fields. Throw (or reject) to report failure.
   */
  onSubmit?: (values: T, changes: Partial<T>) => Promise<void> | void;
  /** Per-field equality, used to compute `changes`. @default Object.is */
  equals?: (a: unknown, b: unknown, field: keyof T & string) => boolean;
}

const EMPTY = {};

/**
 * Tracks an editable copy (draft) of an entity, independent of any edit
 * session or transport. Use it for forms saved through RPC calls rather than
 * a session table.
 *
 * Errors for a field become visible once it has been touched, or after a
 * submit attempt (`errors`); `allErrors` is always the full set.
 */
export const useEntityDraft = <T extends DraftValues>({
  equals = Object.is,
  initialValues,
  onSubmit,
  validate,
}: EntityDraftHookProps<T>) => {
  const [values, setValuesState] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof T, true>>>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<Error | undefined>();
  const submittingRef = useRef(false);
  const callbacksRef = useRef({ equals, onSubmit, validate });
  callbacksRef.current = { equals, onSubmit, validate };

  useEffect(() => {
    setValuesState(initialValues);
    setTouched(EMPTY);
    setSubmitted(false);
    setSubmitError(undefined);
  }, [initialValues]);

  const allErrors = useMemo<DraftErrors<T>>(
    () => validate?.(values) || EMPTY,
    [validate, values],
  );

  const errors = useMemo<DraftErrors<T>>(() => {
    if (submitted) {
      return allErrors;
    }
    return Object.fromEntries(
      Object.entries(allErrors).filter(([field]) => touched[field]),
    ) as DraftErrors<T>;
  }, [allErrors, submitted, touched]);

  const changes = useMemo<Partial<T>>(() => {
    const result: Partial<T> = {};
    for (const field of Object.keys(values) as (keyof T & string)[]) {
      if (!equals(values[field], initialValues[field], field)) {
        result[field] = values[field];
      }
    }
    return result;
  }, [equals, initialValues, values]);

  const setValue = useCallback(
    <K extends keyof T & string>(field: K, value: T[K]) => {
      setValuesState((current) => ({ ...current, [field]: value }));
      setTouched((current) =>
        current[field] ? current : { ...current, [field]: true },
      );
    },
    [],
  );

  const setValues = useCallback((next: Partial<T>) => {
    setValuesState((current) => ({ ...current, ...next }));
  }, []);

  /** Marks a field as touched (e.g. on blur) so its error becomes visible. */
  const touch = useCallback((field: keyof T & string) => {
    setTouched((current) =>
      current[field] ? current : { ...current, [field]: true },
    );
  }, []);

  /** Restores the initial values, or replaces them with `nextValues`. */
  const reset = useCallback(
    (nextValues: T = initialValues) => {
      setValuesState(nextValues);
      setTouched(EMPTY);
      setSubmitted(false);
      setSubmitError(undefined);
    },
    [initialValues],
  );

  const isDirty = Object.keys(changes).length > 0;
  const isValid = Object.keys(allErrors).length === 0;

  /**
   * Validates and, if valid, calls `onSubmit`. Resolves true on success.
   * Concurrent calls are ignored while a submit is in progress.
   */
  const submit = useCallback(async () => {
    setSubmitted(true);
    if (!isValid || submittingRef.current) {
      return false;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      await callbacksRef.current.onSubmit?.(values, changes);
      return true;
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause : new Error(String(cause)));
      return false;
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [changes, isValid, values]);

  return {
    allErrors,
    changes,
    errors,
    initialValues,
    isDirty,
    isValid,
    reset,
    setValue,
    setValues,
    submit,
    submitError,
    submitted,
    submitting,
    touch,
    touched,
    values,
  };
};
