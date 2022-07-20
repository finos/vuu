import { bumpDependencies, exec } from './utils.mjs';

(async function () {
  try {
    const currentPath = process.cwd();
    const PACKAGE_PATH = `${currentPath}/packages`;

    console.log('[BUMP PACKAGE VERSION]');
    await Promise.all([
      exec(`cd ${PACKAGE_PATH}/utils && npm version patch`),
      exec(`cd ${PACKAGE_PATH}/react-utils && npm version patch`),
      exec(`cd ${PACKAGE_PATH}/theme && npm version patch`),
      exec(`cd ${PACKAGE_PATH}/data-remote && npm version patch`),
      exec(`cd ${PACKAGE_PATH}/data-store && npm version patch`),
      exec(`cd ${PACKAGE_PATH}/data-worker && npm version patch`),
      exec(`cd ${PACKAGE_PATH}/ui-controls && npm version patch`),
      exec(`cd ${PACKAGE_PATH}/datagrid-parsers && npm version patch`),
      exec(`cd ${PACKAGE_PATH}/data-grid && npm version patch`),
      exec(`cd ${PACKAGE_PATH}/layout && npm version patch`),
      exec(`cd ${PACKAGE_PATH}/parsed-input && npm version patch`),
      exec(`cd ${PACKAGE_PATH}/shell && npm version patch`),
      exec(`cd ${PACKAGE_PATH}/app && npm version patch`),
      exec(`cd ${PACKAGE_PATH}/app-vuu-example && npm version patch`),
      exec(`cd ${PACKAGE_PATH}/showcase && npm version patch`)
    ]);

    console.log('[BUMP DEPENDENCY VERSIONS]');
    bumpDependencies(`${PACKAGE_PATH}/utils/package.json`);
    bumpDependencies(`${PACKAGE_PATH}/react-utils/package.json`);
    bumpDependencies(`${PACKAGE_PATH}/theme/package.json`);
    bumpDependencies(`${PACKAGE_PATH}/data-remote/package.json`);
    bumpDependencies(`${PACKAGE_PATH}/data-store/package.json`);
    bumpDependencies(`${PACKAGE_PATH}/data-worker/package.json`);
    bumpDependencies(`${PACKAGE_PATH}/ui-controls/package.json`);
    bumpDependencies(`${PACKAGE_PATH}/datagrid-parsers/package.json`);
    bumpDependencies(`${PACKAGE_PATH}/data-grid/package.json`);
    bumpDependencies(`${PACKAGE_PATH}/layout/package.json`);
    bumpDependencies(`${PACKAGE_PATH}/parsed-input/package.json`);
    bumpDependencies(`${PACKAGE_PATH}/shell/package.json`);
    bumpDependencies(`${PACKAGE_PATH}/app/package.json`);
    bumpDependencies(`${PACKAGE_PATH}/app-vuu-example/package.json`);
    bumpDependencies(`${PACKAGE_PATH}/showcase/package.json`);
  } catch (error) {
    console.error(error);
    process.exit((error && error.code) || 1); // properly exit with error code (useful for CI or chaining)
  }
})();
