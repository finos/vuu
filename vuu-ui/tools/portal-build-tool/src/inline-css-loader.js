const normalizePath = (filePath) => filePath.split("\\").join("/");

const matchesPattern = (filePath, pattern) =>
  pattern instanceof RegExp ? pattern.test(filePath) : filePath.includes(pattern);

export default function inlineCssLoader(content, map) {
  const callback = this.async();
  const options = this.getOptions?.() ?? {};
  const { include = [], exclude = [] } = options;
  const resourcePath = this.resourcePath;
  const normalizedPath = resourcePath ? normalizePath(resourcePath) : "";

  if (
    !resourcePath ||
    exclude.some((pattern) => matchesPattern(normalizedPath, pattern)) ||
    !include.some((pattern) => matchesPattern(normalizedPath, pattern))
  ) {
    callback(null, content, map);
    return;
  }

  callback(null, content.replace(/\.css(?=(?:["']))/g, ".css?inline"), map);
}
