import { exec } from './utils.mjs';

(async function () {
  try {
    //   const yargs = require('yargs');

    console.log('[PUBLISHING]');

    const currentPath = process.cwd();
    const PACKAGE_PATH = `${currentPath}/packages`;

    await Promise.all([
      exec(
        `cd ${PACKAGE_PATH}/utils && npm publish --registry https://registry.npmjs.org --access public`
      ),
      exec(
        `cd ${PACKAGE_PATH}/react-utils && npm publish --registry https://registry.npmjs.org --access public`
      ),
      exec(
        `cd ${PACKAGE_PATH}/theme && npm publish --registry https://registry.npmjs.org --access public`
      ),
      exec(
        `cd ${PACKAGE_PATH}/data-remote && npm publish --registry https://registry.npmjs.org --access public`
      ),
      exec(
        `cd ${PACKAGE_PATH}/data-store && npm publish --registry https://registry.npmjs.org --access public`
      ),
      exec(
        `cd ${PACKAGE_PATH}/data-worker && npm publish --registry https://registry.npmjs.org --access public`
      ),
      exec(
        `cd ${PACKAGE_PATH}/ui-controls && npm publish --registry https://registry.npmjs.org --access public`
      ),
      exec(
        `cd ${PACKAGE_PATH}/datagrid-parsers && npm publish --registry https://registry.npmjs.org --access public`
      ),
      exec(
        `cd ${PACKAGE_PATH}/data-grid && npm publish --registry https://registry.npmjs.org --access public`
      ),
      exec(
        `cd ${PACKAGE_PATH}/layout && npm  publish --registry https://registry.npmjs.org --access public`
      ),
      exec(
        `cd ${PACKAGE_PATH}/parsed-input && npm  publish --registry https://registry.npmjs.org --access public`
      ),
      exec(
        `cd ${PACKAGE_PATH}/shell && npm  publish --registry https://registry.npmjs.org --access public`
      )
    ]);
  } catch (error) {
    console.error(error);
    process.exit((error && error.code) || 1); // properly exit with error code (useful for CI or chaining)
  }
})();
