import React, { Suspense, useEffect } from "react";
import { registerComponent } from "@finos/vuu-layout";
import { ErrorBoundary } from "./ErrorBoundary";
import { Loader } from "./Loader";
import { importCSS } from "./css-module-loader";

const componentsMap = new Map();

const useCachedFeature = (url: string) => {
  useEffect(
    () => () => {
      componentsMap.delete(url);
    },
    [url]
  );

  if (!componentsMap.has(url)) {
    componentsMap.set(
      url,
      React.lazy(() => import(/* @vite-ignore */ url))
    );
  }

  return componentsMap.get(url);
};

export interface FeatureProps<Params extends object | undefined = undefined> {
  height?: number;
  url: string;
  css?: string;
  width?: number;
  params: Params;
}

function RawFeature<Params extends object | undefined>({
  url,
  css,
  params,
  ...props
}: FeatureProps<Params>) {
  console.log("Feature render", { css, url, props });
  useEffect(() => {
    console.log("%cFeature mount", "color: green;");
    return () => {
      console.log("%cFeature unmount", "color:red;");
    };
  }, []);

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
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loader />}>
        <LazyFeature {...props} {...params} />
      </Suspense>
    </ErrorBoundary>
  );
}

export const Feature = React.memo(RawFeature);
Feature.displayName = "Feature";
registerComponent("Feature", Feature, "view");
