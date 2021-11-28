import fs from 'fs';
import { build } from 'esbuild';

const SRC = './src/examples/';
const storyFiles = [];

async function loadModule(filePath, exports) {
  const { default: module } = await import(filePath);
  return {
    fileName: filePath,
    module,
    exports: exports.filter((name) => name !== 'default')
  };
}

fs.readdirSync(SRC).forEach((fileName) => {
  console.log(fileName);
  if (fileName.endsWith('stories.jsx') || fileName.endsWith('stories.js')) {
    storyFiles.push(`${SRC}${fileName}`);
  }
});

if (storyFiles.length) {
  const { metafile } = await build({
    entryPoints: storyFiles,
    format: 'esm',
    metafile: true,
    outdir: 'dist',
    outExtension: { '.js': '.mjs' }
  }).catch(() => process.exit(1));

  const { outputs } = metafile;

  const files = Object.entries(outputs).map(([fileName, { exports }]) =>
    loadModule(`../${fileName}`, exports)
  );

  const stories = await Promise.all(files);

  console.log(JSON.stringify(stories, null, 2));
}
