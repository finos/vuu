import { importCSS, registerComponent } from "@vuu-ui/vuu-utils";
import React, { useEffect } from "react";
import { LegacyFeatureErrorBoundary } from "./LegacyFeatureErrorBoundary";
import type { DynamicFeatureProps } from "./types";

const components = new Map<string, ReturnType<typeof React.lazy>>();

const useCachedFeature = (url: string) => {
  useEffect(
    () => () => {
      components.delete(url);
    },
    [url],
  );

  if (!components.has(url)) {
    components.set(
      url,
      React.lazy(() => import(/* webpackIgnore: true */ url)),
    );
  }

  const feature = components.get(url);
  if (!feature) {
    throw Error(`Unable to load lazy feature at ${url}`);
  }
  return feature;
};

const RawLegacyFeature = <Params extends object | undefined>({
  url,
  css,
  ComponentProps: params,
  ...props
}: DynamicFeatureProps<Params>) => {
  if (css) {
    importCSS(css).then((styleSheet) => {
      document.adoptedStyleSheets = [
        ...document.adoptedStyleSheets,
        styleSheet,
      ];
    });
  }

  const LazyFeature = useCachedFeature(url);
  return (
    <LegacyFeatureErrorBoundary url={url}>
      <LazyFeature {...props} {...params} />
    </LegacyFeatureErrorBoundary>
  );
};

export const LegacyFeature = React.memo(RawLegacyFeature);
LegacyFeature.displayName = "LegacyFeature";
registerComponent("Feature", LegacyFeature, "view");
