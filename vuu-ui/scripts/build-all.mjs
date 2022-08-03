import { exec } from './utils.mjs';

const args = process.argv.slice(2);

const skipTypedefs = args.includes('--typedefs') ? '' : ' --skip-typedefs';
const watch = args.includes('--watch') ? ' --watch' : '';
const dev = args.includes('--dev') ? ' --dev' : '';

const YARN_BUILD = `yarn --silent build${dev}${watch}${skipTypedefs}`;

(async function () {
  try {
    console.log('[BUILDING]');
    const ROOT_PATH = process.cwd();
    const PACKAGE_PATH = `${ROOT_PATH}/packages`;
    await Promise.all([
      exec(`cd ${PACKAGE_PATH}/utils && ${YARN_BUILD}`),
      exec(`cd ${PACKAGE_PATH}/react-utils && ${YARN_BUILD}`),
      exec(`cd ${PACKAGE_PATH}/theme && ${YARN_BUILD}`)
    ]);

    await Promise.all([
      exec(`cd ${PACKAGE_PATH}/data-remote && ${YARN_BUILD}`),
      exec(`cd ${PACKAGE_PATH}/data-store && ${YARN_BUILD}`),
      exec(`cd ${PACKAGE_PATH}/data-worker && ${YARN_BUILD}`),
      exec(`cd ${PACKAGE_PATH}/datagrid-parsers && ${YARN_BUILD}`)
    ]);

    await Promise.all([exec(`cd ${PACKAGE_PATH}/ui-controls && ${YARN_BUILD}`)]);

    await Promise.all([
      exec(`cd ${PACKAGE_PATH}/data-grid && ${YARN_BUILD}`),
      exec(`cd ${PACKAGE_PATH}/layout && ${YARN_BUILD}`),
      exec(`cd ${PACKAGE_PATH}/parsed-input && ${YARN_BUILD}`),
      exec(`cd ${PACKAGE_PATH}/shell && ${YARN_BUILD}`)
    ]);
  } catch (error) {
    console.error(error);
    process.exit((error && error.code) || 1); // properly exit with error code (useful for CI or chaining)
  }
})();
