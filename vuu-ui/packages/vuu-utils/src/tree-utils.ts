import { TreeSourceNode } from "./tree-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { DataSourceRow } from "@finos/vuu-data-types";
import { metadataKeys } from "./column-utils";
import { IconProvider } from "@finos/vuu-data-local/src/tree-data-source/IconProvider";

const { COUNT } = metadataKeys;

type Index = { value: number };

export const treeToDataSourceRows = (
  treeSourceNodes: TreeSourceNode[],
  iconProvider?: IconProvider,
): [ColumnDescriptor[], DataSourceRow[]] => {
  const columns: ColumnDescriptor[] = [];

  columns.push(
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
    const { childNodes, header, icon, id, label } = treeSourceNodes[i];
    const blanks = Array(depth - 1).fill("");
    const fullKey = `${keyBase}|${label}`;
    // prettier-ignore
    const row = [index.value, index.value, false,false,depth,0,fullKey,0, ...blanks, label ] as DataSourceRow;
    iconProvider?.setIcon(fullKey, icon);
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
