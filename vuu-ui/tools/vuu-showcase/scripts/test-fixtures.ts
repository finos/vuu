import fs from "fs";
import path from "path";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { resolveWithin } from "./safe-path";
import type { NodeData } from "./treeSourceFromFileSystem";

/**
 * Playwright component tests mount showcase examples by id, e.g.
 * mount("Filters/ColumnFilter/ControlledTextColumnFilter"). Recording which
 * tests use each example warns developers that changing it may break tests.
 */
export const TEST_FILE_PATTERN = /\.playwright\.test\.tsx?$/;

const IGNORED_DIRS = new Set([
  ".git",
  ".showcase",
  "dist",
  "node_modules",
  "test-results",
]);

/** Paths, relative to root, of all Playwright test files beneath root */
export const findTestFiles = (root: string) => {
  const files: string[] = [];
  const visit = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      // entry.name is a single directory entry name, it cannot contain separators
      // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          visit(entryPath);
        }
      } else if (TEST_FILE_PATTERN.test(entry.name)) {
        files.push(path.relative(root, entryPath));
      }
    }
  };
  visit(root);
  return files.sort();
};

const STRING_LITERAL = /(["'`])([\w$./-]+)\1/g;

/**
 * Finds every string literal that is an example id. Matching literals rather
 * than mount calls also finds ids assigned to variables first, the ids are
 * specific enough not to match unrelated strings.
 */
export const findExampleIds = (text: string, exampleIds: Set<string>) => {
  const found = new Set<string>();
  for (const [, , literal] of text.matchAll(STRING_LITERAL)) {
    if (exampleIds.has(literal)) {
      found.add(literal);
    }
  }
  return found;
};

const visitExamples = (
  nodes: TreeSourceNode<NodeData>[],
  visit: (node: TreeSourceNode<NodeData>) => void,
) => {
  for (const node of nodes) {
    if (node.childNodes?.length) {
      visitExamples(node.childNodes, visit);
    } else if (typeof node.nodeData?.componentName === "string") {
      visit(node);
    }
  }
};

/**
 * Records, as nodeData.fixtureFor, the test files (relative to root) that
 * use each example.
 */
export const applyFixtureUsage = (
  treeSource: TreeSourceNode<NodeData>[],
  root: string,
  testFiles = findTestFiles(root),
) => {
  const examples = new Map<string, TreeSourceNode<NodeData>>();
  visitExamples(treeSource, (node) => examples.set(node.id, node));
  const exampleIds = new Set(examples.keys());
  let fixtureCount = 0;
  for (const file of testFiles) {
    const text = fs.readFileSync(resolveWithin(root, file), "utf8");
    for (const id of findExampleIds(text, exampleIds)) {
      const nodeData = examples.get(id)?.nodeData;
      if (nodeData) {
        if (!nodeData.fixtureFor) {
          fixtureCount += 1;
        }
        (nodeData.fixtureFor ??= []).push(file);
      }
    }
  }
  return { fixtureCount, testFileCount: testFiles.length };
};
