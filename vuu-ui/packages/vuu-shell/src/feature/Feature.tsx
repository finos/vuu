import {
  DynamicFeatureProps,
  importCSS,
  registerComponent,
} from "@vuu-ui/vuu-utils";
import React, { useEffect } from "react";
import { FeatureErrorBoundary } from "./FeatureErrorBoundary";

/**
 * Ensure we never lazy load the same component more than once
 */
const componentsMap = new Map<string, ReturnType<typeof React.lazy>>();
const useCachedFeature = (url: string) => {
  useEffect(
    () => () => {
      componentsMap.delete(url);
    },
    [url],
  );

  if (!componentsMap.has(url)) {
    componentsMap.set(
      url,
      React.lazy(() => import(/* @vite-ignore */ url)),
    );
  }

  const lazyFeature = componentsMap.get(url);

  if (!lazyFeature) {
    throw Error(`Unable to load Lazy Feature at url ${url}`);
  } else {
    return lazyFeature;
  }
};

function RawFeature<Params extends object | undefined>({
  url,
  css,
  ComponentProps: params,
  ...props
}: DynamicFeatureProps<Params>) {
  if (css) {
    //   import(/* @vite-ignore */ css, { assert: { type: "css" } }).then(
    //     (cssModule) => {
    //       console.log("%cInject Styles", "color: blue;font-weight: bold");
    //       document.adoptedStyleSheets = [
    //         ...document.adoptedStyleSheets,
    //         cssModule.default,
    //       ];
    //     }
    //   );
    // Polyfill until cypress build supports import assertions
    // Note: already fully supported in esbuild and vite
    importCSS(css).then((styleSheet) => {
      document.adoptedStyleSheets = [
        ...document.adoptedStyleSheets,
        styleSheet,
      ];
    });
  }

  const LazyFeature = useCachedFeature(url);
  // Suspense has been removed here - caused components to render twice
  return (
    <FeatureErrorBoundary url={url}>
      <LazyFeature {...props} {...params} />
    </FeatureErrorBoundary>
  );
}

/**
  Feature is a wrapper around React Lazy Loading. It will load a component
  from the given url. That url must resolve to a javascript bundle with a
  single default export. That export must be a React component.
 */
export const Feature = React.memo(RawFeature);
Feature.displayName = "Feature";
registerComponent("Feature", Feature, "view");
