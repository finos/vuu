export const getRegisteredModules = async (registryUrl: string) =>  {
    console.log(`getRegisteredModules ${registryUrl}`)
    const response = await fetch(registryUrl);
    if (response.ok){
        return response.json();
    } else {
        throw Error('bad return from module registry')
    }

}

