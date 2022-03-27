import fs from 'fs';
import path from 'path';
// import { build } from 'esbuild';

const SRC = './src/examples/';
const OUT = './src/generated/stories.json';

// async function loadModule(filePath, exports) {
//   const { default: module } = await import(filePath);
//   return {
//     fileName: filePath,
//     module,
//     exports: exports.filter((name) => name !== 'default')
//   };
// }

function buildPackageTree(dir, tree = {}) {
  fs.readdirSync(dir).forEach((fileName) => {
    const filePath = path.join(dir, fileName);
    if (fs.lstatSync(filePath).isDirectory()) {
      const subTree = buildPackageTree(filePath);
      if (Object.keys(subTree).length > 0) {
        tree[fileName] = buildPackageTree(filePath);
      }
    } else if (fileName.endsWith('stories.jsx')) {
      const [storyName] = fileName.split('.');
      tree[storyName] = `${dir}${fileName}`;
    }
  });
  return tree;
}

const stories = buildPackageTree(SRC);
fs.writeFile(OUT, JSON.stringify(stories, null, 2), (err) => {
  if (err) {
    console.log(err);
  }
});

// if (storyFiles.length) {
//   const { metafile } = await build({
//     entryPoints: storyFiles,
//     format: 'esm',
//     metafile: true,
//     outdir: 'dist',
//     outExtension: { '.js': '.mjs' }
//   }).catch(() => process.exit(1));

//   const { outputs } = metafile;

//   const files = Object.entries(outputs).map(([fileName, { exports }]) =>
//     loadModule(`../${fileName}`, exports)
//   );

//   const stories = await Promise.all(files);

console.log(JSON.stringify(stories, null, 2));
// }
