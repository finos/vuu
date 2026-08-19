const DEFAULT_INCLUDE = [
  "/packages/grid-layout/",
  "/packages/vuu-datatable/",
  "/packages/vuu-context-menu/",
  "/packages/vuu-data-react/",
  "/packages/vuu-filters/",
  "/packages/vuu-layout/",
  "/packages/vuu-notifications/",
  "/packages/vuu-popups/",
  "/packages/vuu-shell/",
  "/packages/vuu-chart/",
  "/packages/vuu-table/",
  "/packages/vuu-table-extras/",
  "/packages/vuu-ui-controls/",
];

const DEFAULT_EXCLUDE = [".stories.tsx"];

function normalizePath(filePath) {
  return filePath.split("\\").join("/");
}

function matchesPattern(filePath, pattern) {
  if (pattern instanceof RegExp) {
    return pattern.test(filePath);
  }

  return filePath.includes(pattern);
}

function shouldTransform(
  filePath,
  include = DEFAULT_INCLUDE,
  exclude = DEFAULT_EXCLUDE,
) {
  const normalizedPath = normalizePath(filePath);

  if (exclude.some((pattern) => matchesPattern(normalizedPath, pattern))) {
    return false;
  }

  return include.some((pattern) => matchesPattern(normalizedPath, pattern));
}

export default function inlineCssLoader(content, map) {
  const callback = this.async();
  const options = this.getOptions?.() ?? {};
  const { include, exclude } = options;
  const resourcePath = this.resourcePath;

  if (!resourcePath || !shouldTransform(resourcePath, include, exclude)) {
    callback(null, content, map);
    return;
  }

  const transformed = content.replace(/\.css(?=(?:["']))/g, ".css?inline");
  callback(null, transformed, map);
}
