import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import {
  DEFAULT_PREVIEW_STATE,
  loadPreviewPreferences,
  type PreviewState,
  readPreviewState,
  storePreviewPreferences,
  writePreviewParams,
} from "./example/preview-state";

export type { DataLocation, Density, ThemeMode } from "./example/preview-state";

export interface ShowcaseContextProps {
  preview: PreviewState;
  /** updates the url, the change is also remembered as a preference */
  setPreview: (changes: Partial<PreviewState>) => void;
}

export const ShowcaseContext = createContext<ShowcaseContextProps>({
  preview: DEFAULT_PREVIEW_STATE,
  setPreview: () =>
    console.log("[ShowcaseContext] No preview change handler provided"),
});

export const useShowcaseContext = () => useContext(ShowcaseContext);

/**
 * Preview settings (theme, mode, density, viewport, data source) used to
 * render examples. These are held in the url, see preview-state.ts.
 */
export const ShowcaseProvider = ({ children }: { children: ReactNode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [preferences, setPreferences] = useState(loadPreviewPreferences);

  const preview = useMemo(
    () => readPreviewState(searchParams, preferences),
    [preferences, searchParams],
  );

  const setPreview = useCallback(
    (changes: Partial<PreviewState>) => {
      setPreferences((current) => {
        const next = { ...current, ...changes };
        storePreviewPreferences(next);
        return next;
      });
      setSearchParams((params) => writePreviewParams(params, changes), {
        replace: true,
      });
    },
    [setSearchParams],
  );

  const value = useMemo(() => ({ preview, setPreview }), [preview, setPreview]);

  return (
    <ShowcaseContext.Provider value={value}>
      {children}
    </ShowcaseContext.Provider>
  );
};
