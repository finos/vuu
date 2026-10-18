import path from "path";

/**
 * Resolves relativePath against baseDir, throwing if the result would lie
 * outside baseDir (e.g. via `..` segments or an absolute path).
 */
export const resolveWithin = (baseDir: string, relativePath: string) => {
  // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
  const base = path.resolve(baseDir);
  // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
  const resolved = path.resolve(base, relativePath);
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    throw new Error(`path '${relativePath}' resolves outside '${baseDir}'`);
  }
  return resolved;
};
