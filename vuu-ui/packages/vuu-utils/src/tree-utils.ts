import { TreeSourceNode } from "./tree-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { DataSourceRow } from "@finos/vuu-data-types";
import { metadataKeys } from "./column-utils";
import { IconProvider } from "@finos/vuu-data-local/src/tree-data-source/IconProvider";

const { COUNT, DEPTH, IDX, KEY } = metadataKeys;

type Index = { value: number };

export const treeToDataSourceRows = (
  treeSourceNodes: TreeSourceNode[],
  iconProvider?: IconProvider,
): [ColumnDescriptor[], DataSourceRow[]] => {
  const columns: ColumnDescriptor[] = [];

  columns.push(
    {
      name: "nodeData",
      type: "json",
    },
    {
      getIcon: iconProvider?.getIcon,
      name: "Level 1",
      type: "string",
    },
    {
      getIcon: iconProvider?.getIcon,
      name: "Level 2",
      type: "string",
    },
  );

  const rows: DataSourceRow[] = [];

  addChildValues(rows, treeSourceNodes, columns, iconProvider);
  return [columns, rows];
};

const addChildValues = (
  rows: DataSourceRow[],
  treeSourceNodes: TreeSourceNode[],
  cols: ColumnDescriptor[],
  iconProvider: IconProvider | undefined,
  index: Index = { value: 0 },
  keyBase = "$root",
  depth = 1,
): [number, number] => {
  let leafCount = 0;
  let rowCount = 0;
  if (depth === cols.length - 1) {
    cols.push({
      getIcon: iconProvider?.getIcon,
      name: `Level ${cols.length + 1}`,
      type: "string",
    });
  }
  for (let i = 0; i < treeSourceNodes.length; i++, index.value += 1) {
    const { childNodes, icon, label, nodeData } = treeSourceNodes[i];
    const blanks = Array(depth - 1).fill("");
    const fullKey = `${keyBase}|${label}`;
    // prettier-ignore
    const row = [index.value, index.value, false,false,depth,0,fullKey,0, nodeData, ...blanks, label ] as DataSourceRow;
    if (icon) {
      iconProvider?.setIcon(fullKey, icon);
    }
    rows.push(row);
    rowCount += 1;

    if (childNodes && childNodes.length > 0) {
      const [nestedLeafCount, nestedRowCount] = addChildValues(
        rows,
        childNodes,
        cols,
        iconProvider,
        { value: index.value + 1 },
        fullKey,
        depth + 1,
      );
      row[COUNT] = nestedLeafCount;
      leafCount += nestedLeafCount;
      rowCount += nestedRowCount;
      index.value += nestedRowCount;
    } else {
      leafCount += 1;
    }
  }

  return [leafCount, rowCount];
};

export const lastPathSegment = (path: string, separator = "/") => {
  const root = path.endsWith(separator) ? path.slice(0, -1) : path;
  return root.slice(root.lastIndexOf(separator) + 1);
};

export const dropLastPathSegment = (path: string, separator = "/") => {
  return path.slice(0, path.lastIndexOf(separator));
};

export const getParentRow = (rows: DataSourceRow[], row: DataSourceRow) => {
  const { [IDX]: idx, [DEPTH]: depth } = row;
  for (let i = idx - 1; i >= 0; i--) {
    const nextRow = rows[i];
    if (nextRow[DEPTH] === depth - 1) {
      return nextRow;
    }
  }
};

const rowsAreSiblings = (key1: string, key2: string) =>
  dropLastPathSegment(key1, "|") === dropLastPathSegment(key2, "|");

export const missingAncestor = (
  row: DataSourceRow,
  previousRow?: DataSourceRow,
) => {
  if (previousRow) {
    const prevKey = previousRow[KEY];
    const key = row[KEY];

    if (key.startsWith(prevKey)) {
      return false;
    } else if (!rowsAreSiblings(prevKey, key)) {
      return true;
    }
  } else if (row[DEPTH] > 1) {
    return true;
  }

  return false;
};
