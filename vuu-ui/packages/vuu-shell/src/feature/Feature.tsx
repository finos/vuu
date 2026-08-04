import {
  type DynamicFeatureProps,
  // importCSS,
  registerComponent,
} from "@vuu-ui/vuu-utils";
import React, { lazy } from "react";
import { FeatureErrorBoundary } from "./FeatureErrorBoundary";
import {
  loadRemote,
  registerRemotes,
} from "@module-federation/enhanced/runtime";
import { RemoteModule } from "./RemoteModule";

const portalConnection = { connectionId: "portal" };

const getLazyComponent = (
  name: string,
  component: string,
  mfManifestUrl: string,
) => {
  console.log(`register remote ${name} ${mfManifestUrl}`);
  registerRemotes([
    {
      name,
      entry: mfManifestUrl,
    },
  ]);

  return lazy(async () => {
    const remote = await loadRemote<{
      default: React.ComponentType<Record<string, unknown>>;
    }>(`${name}/${component}`, { from: "runtime" });
    if (remote === null) {
      throw Error(`Unable to load remote component ${name}/${component}`);
    }
    return remote;
  });
};

/**
 * Ensure we never lazy load the same component more than once
 */
const componentsMap = new Map<string, ReturnType<typeof React.lazy>>();
const useCachedFeature = (
  mfManifestUrl: string,
  scope: string,
  component: string,
) => {
  // useEffect(
  //   () => () => {
  //     componentsMap.delete(url);
  //   },
  //   [url],
  // );

  const componentPath = `${scope}/${component}`;

  if (!componentsMap.has(componentPath)) {
    componentsMap.set(
      componentPath,
      getLazyComponent(scope, component, `${mfManifestUrl}/mf-manifest.json`),
    );
  }

  const lazyFeature = componentsMap.get(componentPath);

  if (!lazyFeature) {
    throw Error(`Unable to load Lazy Feature ${componentPath}`);
  } else {
    return lazyFeature;
  }
};

function RawFeature<Params extends object | undefined>({
  mfComponent,
  mfScope,
  mfUrl,
  vuu,
  css,
  ComponentProps: params,
  ...props
}: DynamicFeatureProps<Params>) {
  // if (css) {
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
  // importCSS(css).then((styleSheet) => {
  //   document.adoptedStyleSheets = [
  //     ...document.adoptedStyleSheets,
  //     styleSheet,
  //   ];
  // });
  // }

  console.log(">>>>> create a feature");

  const LazyFeature = useCachedFeature(mfUrl, mfScope, mfComponent);
  const connection = vuu ?? portalConnection;
  // Suspense has been removed here - caused components to render twice
  return (
    <FeatureErrorBoundary
      mfComponent={mfComponent}
      mfScope={mfScope}
      mfUrl={mfUrl}
    >
      <RemoteModule connection={connection}>
        <LazyFeature {...props} {...params} />
      </RemoteModule>
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
