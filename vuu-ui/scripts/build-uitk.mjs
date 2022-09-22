import shell from 'shelljs';

const args = process.argv.slice(2);
const dev = args.includes('--dev') ? ' --dev' : '';

function buildPackage(packageName) {
  shell.cd(`uitk/packages/${packageName}`);
  shell.exec(`node ../../../scripts/run-build-uitk.mjs${dev}`);
  shell.cd('../../..');
}

const packages = ['icons', 'core', 'lab'];

packages.forEach((packageName) => buildPackage(packageName));
