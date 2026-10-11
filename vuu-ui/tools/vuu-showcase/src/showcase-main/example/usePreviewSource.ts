import { useCallback, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useShowcaseContext } from "../ShowcaseProvider";
import { standaloneUrl } from "./preview-state";

/**
 * The iframe src for the current route. Derived only from the pathname, the
 * anchor and the preview state, so other url params (e.g. the selected tab)
 * never reload the iframe. Theme changes do reload, mode and density are
 * applied via the url hash, without reloading.
 */
export const usePreviewSource = () => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { preview } = useShowcaseContext();
  const anchor = searchParams.get("anchor");
  const [reloadCount, setReloadCount] = useState(0);
  const src = useMemo(
    () => standaloneUrl(pathname, preview, anchor),
    [anchor, pathname, preview],
  );
  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  return { preview, reload, reloadKey: `${pathname}:${reloadCount}`, src };
};
