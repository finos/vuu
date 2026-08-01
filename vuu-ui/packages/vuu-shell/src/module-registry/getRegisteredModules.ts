import type { DynamicFeatureDescriptor } from "@vuu-ui/vuu-utils";

export const getRegisteredModules = async (registryUrl: string, bearerToken: string) => {
    console.log(`getRegisteredModules ${registryUrl} bearerToken ${bearerToken}`)
    const response = await fetch(registryUrl, {
        headers: { Authorization: `Bearer ${bearerToken}` },
    });
    if (response.ok) {
        return response.json() as Promise<Record<string, DynamicFeatureDescriptor>>;
    } else {
        throw Error('bad return from module registry')
    }

}

