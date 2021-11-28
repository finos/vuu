// import atImport from "postcss-import";
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import postcss from 'rollup-plugin-postcss';
import resolve from '@rollup/plugin-node-resolve';
import visualizer from 'rollup-plugin-visualizer';

const config = {
  input: 'src/index.js',
  output: {
    file: 'dist/index.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    resolve({
      extensions: ['.js', '.jsx']
    }),
    // commonjs(commonJsConfig),
    commonjs({
      include: /\/node_modules\//
    }),
    babel({
      babelrc: false,
      include: [`../../packages/**/*`],
      exclude: 'node_modules/**',
      presets: [['@babel/preset-react', { modules: false }]],
      plugins: [
        // "@babel/plugin-syntax-dynamic-import",
        // "@babel/plugin-proposal-optional-chaining",
        // "@babel/plugin-proposal-nullish-coalescing-operator",
      ]
    }),
    postcss({
      // plugins: [atImport()],
      minimize: false,
      extract: false,
      sourceMap: false
    }),
    filesize(),
    visualizer()
  ],
  external: ['@heswell/utils', 'classnames', 'react', 'react-dom']
};

export default config;
