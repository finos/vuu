import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import type { NodeData } from "./treeSourceFromFileSystem";

/**
 * The example history is a committed ledger recording the date (yyyy-mm-dd)
 * each example first appeared in the showcase tree, keyed by example id.
 * Every build diffs the current tree against the ledger: new examples are
 * added with today's date, examples that no longer exist are removed.
 */
export type ExampleHistory = Record<string, string>;

export const EXAMPLE_HISTORY_FILE = "example-history.json";

const isExample = ({ nodeData }: TreeSourceNode<NodeData>) =>
  typeof nodeData?.componentName === "string";

const visitExamples = (
  nodes: TreeSourceNode<NodeData>[],
  visit: (node: TreeSourceNode<NodeData>) => void,
) => {
  for (const node of nodes) {
    if (node.childNodes?.length) {
      visitExamples(node.childNodes, visit);
    } else if (isExample(node)) {
      visit(node);
    }
  }
};

export const today = () => new Date().toISOString().slice(0, 10);

const sortKeys = (history: ExampleHistory): ExampleHistory =>
  Object.fromEntries(
    Object.entries(history).sort(([k1], [k2]) => k1.localeCompare(k2)),
  );

/**
 * Diffs the tree against the history. Returns the updated history (keys
 * sorted, for stable diffs) and the ids added and removed.
 */
export const updateExampleHistory = (
  history: ExampleHistory,
  treeSource: TreeSourceNode<NodeData>[],
  date: string | ((node: TreeSourceNode<NodeData>) => string | undefined),
) => {
  const next: ExampleHistory = {};
  const added: string[] = [];
  const dateOf = typeof date === "string" ? () => date : date;
  visitExamples(treeSource, (node) => {
    const known = history[node.id];
    if (known) {
      next[node.id] = known;
    } else {
      added.push(node.id);
      next[node.id] = dateOf(node) ?? today();
    }
  });
  const removed = Object.keys(history).filter((id) => !(id in next));
  return { added, history: sortKeys(next), removed };
};

/** Records the history date on each example as nodeData.added */
export const applyExampleHistory = (
  treeSource: TreeSourceNode<NodeData>[],
  history: ExampleHistory,
) => {
  visitExamples(treeSource, (node) => {
    const added = history[node.id];
    if (added && node.nodeData) {
      node.nodeData.added = added;
    }
  });
};

const EXPORT = /^([+-])export (?:const|function) (\w+)/;

/**
 * Date each example export was first committed, keyed by the file path
 * (relative to the repo root) then export name. Built from a single pass over
 * the git history of the examples folder. Follows file renames and exports
 * moved between files within a commit. Empty if git is unavailable.
 */
export const gitExportDates = (examplesPath: string) => {
  const files = new Map<string, Map<string, string>>();
  let log: string;
  try {
    log = execFileSync(
      "git",
      ["log", "--reverse", "-M", "--format=C %cs", "-p", "-U0", "--", "."],
      {
        cwd: examplesPath,
        encoding: "utf8",
        maxBuffer: 1 << 30,
        stdio: "pipe",
      },
    );
  } catch {
    return files;
  }
  let date = "";
  let oldFile: string | undefined;
  let newFile: string | undefined;
  let adds: [string, string][] = [];
  let removes = new Map<string, string>();
  const flush = () => {
    for (const [file, name] of adds) {
      const exports = files.get(file) ?? new Map<string, string>();
      files.set(file, exports);
      if (!exports.has(name)) {
        // an export moved from another file keeps its original date
        exports.set(name, removes.get(name) ?? date);
      }
    }
    adds = [];
    removes = new Map();
  };
  const filePath = (line: string) =>
    line === "/dev/null" ? undefined : line.slice(2);
  for (const line of log.split("\n")) {
    if (line.startsWith("C ")) {
      flush();
      date = line.slice(2);
    } else if (line.startsWith("rename from ")) {
      oldFile = line.slice(12);
    } else if (line.startsWith("rename to ")) {
      const renamed = line.slice(10);
      const exports = oldFile ? files.get(oldFile) : undefined;
      if (oldFile && exports) {
        files.set(renamed, exports);
        files.delete(oldFile);
      }
    } else if (line.startsWith("--- ")) {
      oldFile = filePath(line.slice(4));
    } else if (line.startsWith("+++ ")) {
      newFile = filePath(line.slice(4));
    } else {
      const [, sign, name] = line.match(EXPORT) ?? [];
      if (sign === "+" && newFile) {
        adds.push([newFile, name]);
      } else if (sign === "-" && oldFile) {
        const known = files.get(oldFile)?.get(name);
        if (known) {
          removes.set(name, known);
        }
      }
    }
  }
  flush();
  return files;
};

const gitRoot = (dir: string) => {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: dir,
      encoding: "utf8",
      stdio: "pipe",
    }).trim();
  } catch {
    return undefined;
  }
};

/** Seeds dates for a new history from git, where available */
const gitDateOf = (examplesPath: string) => {
  const root = gitRoot(examplesPath);
  const dates = gitExportDates(examplesPath);
  return ({ nodeData }: TreeSourceNode<NodeData>) => {
    if (root && nodeData?.path && nodeData.componentName) {
      const file = path.relative(root, path.resolve(nodeData.path));
      return dates.get(file)?.get(nodeData.componentName);
    }
  };
};

/**
 * Reads the history file, brings it up to date with the tree (rewriting the
 * file only if it changed) and records the dates on the tree. If the file
 * does not exist, it is created with dates seeded from git history.
 */
export const syncExampleHistory = (
  treeSource: TreeSourceNode<NodeData>[],
  examplesPath: string,
  historyFile = EXAMPLE_HISTORY_FILE,
) => {
  const exists = fs.existsSync(historyFile);
  const history: ExampleHistory = exists
    ? JSON.parse(fs.readFileSync(historyFile, "utf8"))
    : {};
  const update = updateExampleHistory(
    history,
    treeSource,
    exists ? today() : gitDateOf(examplesPath),
  );
  if (!exists || update.added.length || update.removed.length) {
    fs.writeFileSync(
      historyFile,
      `${JSON.stringify(update.history, null, 2)}\n`,
    );
    console.log(
      `[example-history] ${historyFile}: ${update.added.length} added, ${update.removed.length} removed`,
    );
  }
  applyExampleHistory(treeSource, update.history);
  return update;
};
