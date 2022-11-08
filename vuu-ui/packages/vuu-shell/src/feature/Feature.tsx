import React, { Suspense } from "react";
import { registerComponent } from "@vuu-ui/vuu-layout";
import { ErrorBoundary } from "./ErrorBoundary";
import { Loader } from "./Loader";
import { importCSS } from "./css-module-loader";

export interface FeatureProps<Params extends object | undefined = undefined> {
  height?: number;
  url: string;
  css?: string;
  width?: number;
  params: Params;
}

// const RawFeature = <Params extends object | undefined>({
function RawFeature<Params extends object | undefined>({
  url,
  css,
  params,
  ...props
}: FeatureProps<Params>) {
  if (css) {
    // import(/* @vite-ignore */ css, { assert: { type: "css" } }).then(
    //   (cssModule) => {
    //     document.adoptedStyleSheets = [
    //       ...document.adoptedStyleSheets,
    //       cssModule.default,
    //     ];
    //   }
    // );
    // Polyfill until vite build supports import assertions
    // Note: already fully supported in esbuild, so vite dev
    importCSS(css).then((styleSheet) => {
      document.adoptedStyleSheets = [
        ...document.adoptedStyleSheets,
        styleSheet,
      ];
    });
  }
  const LazyFeature = React.lazy(() => import(/* @vite-ignore */ url));
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
