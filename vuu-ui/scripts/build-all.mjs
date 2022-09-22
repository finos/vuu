import shell from 'shelljs';

const args = process.argv.slice(2);
const dev = args.includes('--dev') ? ' --dev' : '';

function buildPackage(packageName) {
  shell.cd(`packages/${packageName}`);
  shell.exec(`yarn --silent build${dev}`);
  shell.cd('../..');
}

const packages = [
  'utils',
  'react-utils',
  'theme',
  'data-remote',
  'data-store',
  'datagrid-parsers',
  'ui-controls',
  'data-grid',
  'layout',
  'parsed-input',
  'shell'
];

packages.forEach((packageName) => buildPackage(packageName));
