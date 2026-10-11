import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { type ExhibitImporter, importExhibitByUrl } from "../shared-utils";
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
  /** loads an exhibit module (example or mdx document) by path */
  importExhibit: ExhibitImporter;
  preview: PreviewState;
  /** updates the url, the change is also remembered as a preference */
  setPreview: (changes: Partial<PreviewState>) => void;
}

export const ShowcaseContext = createContext<ShowcaseContextProps>({
  importExhibit: importExhibitByUrl,
  preview: DEFAULT_PREVIEW_STATE,
  setPreview: () =>
    console.log("[ShowcaseContext] No preview change handler provided"),
});

export const useShowcaseContext = () => useContext(ShowcaseContext);

/**
 * Preview settings (theme, mode, density, viewport, data source) used to
 * render examples. These are held in the url, see preview-state.ts.
 */
export const ShowcaseProvider = ({
  children,
  importExhibit = importExhibitByUrl,
}: {
  children: ReactNode;
  importExhibit?: ExhibitImporter;
}) => {
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

  const value = useMemo(
    () => ({ importExhibit, preview, setPreview }),
    [importExhibit, preview, setPreview],
  );

  return (
    <ShowcaseContext.Provider value={value}>
      {children}
    </ShowcaseContext.Provider>
  );
};
