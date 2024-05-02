const NO_DEPENDENCIES = {};

export function buildExternals(packageJson) {
  const { dependencies = NO_DEPENDENCIES, peerDependencies = NO_DEPENDENCIES } =
    packageJson;

  const external = Object.keys(peerDependencies);
  const externalVuu = Object.keys(dependencies);

  return external.concat(externalVuu);
}
