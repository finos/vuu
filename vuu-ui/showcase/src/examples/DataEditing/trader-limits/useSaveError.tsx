import { Banner, BannerContent } from "@salt-ds/core";
import type { EditErrorHandler } from "@vuu-ui/vuu-data-editing";
import { useCallback, useMemo, useState } from "react";

/**
 * Why an edit session could not be saved, e.g. limits that failed the
 * server's checks. Spread `handlers` on the EditableTable, render `banner`.
 * The error is cleared once the session is saved or cancelled.
 */
export const useSaveError = () => {
  const [message, setMessage] = useState<string | undefined>(undefined);

  const onError = useCallback<EditErrorHandler>((error, operation) => {
    if (operation === "save") {
      setMessage(error.message);
    } else {
      console.error(`[TraderLimits] ${operation} failed`, error);
    }
  }, []);
  const clear = useCallback(() => setMessage(undefined), []);

  const handlers = useMemo(
    () => ({ onCancelled: clear, onError, onSaved: clear }),
    [clear, onError],
  );

  const banner =
    message === undefined ? null : (
      <Banner data-testid="save-error" status="error">
        <BannerContent>{message}</BannerContent>
      </Banner>
    );

  return { banner, handlers };
};
