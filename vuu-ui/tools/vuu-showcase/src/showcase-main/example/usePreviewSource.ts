import { useCallback, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useShowcaseContext } from "../ShowcaseProvider";
import { PROPS_PARAM } from "../../example-props";
import { standaloneUrl } from "./preview-state";

/**
 * The iframe src for the current route. Derived only from the pathname, the
 * anchor and the preview state, so other url params (e.g. the selected tab)
 * never reload the iframe. Theme changes do reload; mode, density and
 * example props are applied via the url hash, without reloading.
 */
export const usePreviewSource = () => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { preview } = useShowcaseContext();
  const anchor = searchParams.get("anchor");
  const props = searchParams.get(PROPS_PARAM);
  const [reloadCount, setReloadCount] = useState(0);
  const src = useMemo(
    () => standaloneUrl(pathname, preview, anchor, false, props),
    [anchor, pathname, preview, props],
  );
  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  return { preview, reload, reloadKey: `${pathname}:${reloadCount}`, src };
};
