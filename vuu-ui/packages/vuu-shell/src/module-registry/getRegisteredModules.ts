import type { DynamicFeatureDescriptor } from "@vuu-ui/vuu-utils";

export type RemoteModules = {
  modules: DynamicFeatureDescriptor[]
}

export const getRegisteredModules = async (
  registryUrl: string,
  bearerToken: string,
) => {
  console.log(`getRegisteredModules ${registryUrl}`);
  const response = await fetch(registryUrl, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${bearerToken}` },
  });
  if (!response.ok) {
    throw Error("bad return from module registry");
  }

  return await response.json() as RemoteModules;
};
