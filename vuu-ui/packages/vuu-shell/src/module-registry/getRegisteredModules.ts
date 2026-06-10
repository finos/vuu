import type { DynamicFeatureDescriptor } from "@vuu-ui/vuu-utils";

export const getRegisteredModules = async (registryUrl: string) =>  {
    console.log(`getRegisteredModules ${registryUrl}`)
    const response = await fetch(registryUrl);
    if (response.ok){
        return response.json() as Promise<Record<string, DynamicFeatureDescriptor>>;
    } else {
        throw Error('bad return from module registry')
    }

}

