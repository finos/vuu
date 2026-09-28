export function createTypeDefExports(packageExports) {
  const exports = {
    ...packageExports,
    ".": {
      default: "./src/index.js",
      types: "./types/index.d.ts",
    },
  };

  if (packageExports["./portal"]) {
    exports["./portal"] = {
      default: "./src/portal.js",
      types: "./types/portal.d.ts",
    };
  }

  return exports;
}
