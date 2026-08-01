import type { DynamicFeatureDescriptor } from "@vuu-ui/vuu-utils";

const withDefaults = (
  featureKey: string,
  descriptor: DynamicFeatureDescriptor,
): DynamicFeatureDescriptor => ({
  ...descriptor,
  leftNavLocation: descriptor.leftNavLocation ?? "vuu-features",
  vuu: descriptor.vuu
    ? descriptor.vuu
    : {
        connectionId: featureKey,
      },
});

export const getRegisteredModules = async (registryUrl: string) => {
  console.log(`getRegisteredModules ${registryUrl}`);
  const response = await fetch(registryUrl);
  if (!response.ok) {
    throw Error(
      `bad return from module registry ${registryUrl} (${response.status} ${response.statusText})`,
    );
  }

  const json = (await response.json()) as Record<string, DynamicFeatureDescriptor>;
  return Object.entries(json).reduce<Record<string, DynamicFeatureDescriptor>>(
    (map, [featureKey, descriptor]) => {
      map[featureKey] = withDefaults(featureKey, descriptor);
      return map;
    },
    {},
  );
};
