import shell from 'shelljs';

function buildPackage(packageName) {
  shell.cd(`packages/${packageName}`);
  shell.exec('yarn build');
  shell.cd('../..');
}

const packages = [
  'utils',
  'react-utils',
  'theme',
  'data-remote',
  'data-store',
  'data-worker',
  'datagrid-parsers',
  'ui-controls',
  'data-grid',
  'layout',
  'parsed-input',
  'shell'
];

packages.forEach((packageName) => buildPackage(packageName));
