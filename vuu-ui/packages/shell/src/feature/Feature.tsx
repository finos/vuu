import React, { Suspense } from "react";
import { registerComponent } from "@vuu-ui/layout";
import { ErrorBoundary } from "./ErrorBoundary";
import { Loader } from "./Loader";

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
    import(css, { assert: { type: "css" } }).then((cssModule) => {
      document.adoptedStyleSheets = [
        ...document.adoptedStyleSheets,
        cssModule.default,
      ];
    });
  }
  const LazyFeature = React.lazy(() => import(url));
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
