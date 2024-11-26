import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { TableCellRendererProps } from "@finos/vuu-table-types";

import searchCellCss from "./SearchCell.css";
import { withHighlighting } from "@finos/vuu-utils";

const classBase = "vuuSearchCell";

export const SearchCell = ({
  column,
  columnMap,
  row,
  searchPattern,
}: TableCellRendererProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-search-cell",
    css: searchCellCss,
    window: targetWindow,
  });

  //TODO what about click handling

  const key = columnMap[column.name];
  const value = searchPattern
    ? withHighlighting((v) => String(v), searchPattern)(row[key])
    : row[key];

  return (
    <div className={classBase} tabIndex={-1}>
      <span data-icon="draggable" />
      {value}
    </div>
  );
};
