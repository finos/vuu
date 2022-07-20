import { exec } from './utils.mjs';

(async function () {
  try {
    console.log('[BUILDING]');
    const ROOT_PATH = process.cwd();
    const PACKAGE_PATH = `${ROOT_PATH}/packages`;
    await Promise.all([
      exec(`cd ${PACKAGE_PATH}/utils && yarn build`),
      exec(`cd ${PACKAGE_PATH}/react-utils && yarn build`),
      exec(`cd ${PACKAGE_PATH}/theme && yarn build`)
    ]);

    await Promise.all([
      exec(`cd ${PACKAGE_PATH}/data-remote && yarn build`),
      exec(`cd ${PACKAGE_PATH}/data-store && yarn build`),
      exec(`cd ${PACKAGE_PATH}/data-worker && yarn build`),
      exec(`cd ${PACKAGE_PATH}/datagrid-parsers && yarn build`)
    ]);

    await Promise.all([exec(`cd ${PACKAGE_PATH}/ui-controls && yarn build`)]);

    await Promise.all([
      exec(`cd ${PACKAGE_PATH}/data-grid && yarn build`),
      exec(`cd ${PACKAGE_PATH}/layout && yarn build`),
      exec(`cd ${PACKAGE_PATH}/parsed-input && yarn build`),
      exec(`cd ${PACKAGE_PATH}/shell && yarn build`)
    ]);
  } catch (error) {
    console.error(error);
    process.exit((error && error.code) || 1); // properly exit with error code (useful for CI or chaining)
  }
})();
