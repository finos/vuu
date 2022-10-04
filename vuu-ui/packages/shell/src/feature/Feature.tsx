import React, { Suspense } from "react";
import { registerComponent } from "@vuu-ui/layout";
import { ErrorBoundary } from "./ErrorBoundary";
import { Loader } from "./Loader";

export interface FeatureProps {
  height?: number;
  url: string;
  css?: string;
  width?: number;
}

const RawFeature = ({ url, css, ...props }: FeatureProps) => {
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
      <Suspense maxDuration={300} fallback={<Loader />}>
        <LazyFeature {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

export const Feature = React.memo(RawFeature);
Feature.displayName = "Feature";
registerComponent("Feature", Feature, "view");
