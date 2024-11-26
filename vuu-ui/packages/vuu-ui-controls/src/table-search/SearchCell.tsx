import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { TableCellRendererProps } from "@finos/vuu-table-types";
import { useHighlighting } from "@finos/vuu-table";

import searchCellCss from "./SearchCell.css";

const classBase = "vuuSearchCell";

export const SearchCell = ({
  column,
  columnMap,
  row,
  searchPattern = "",
}: TableCellRendererProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-search-cell",
    css: searchCellCss,
    window: targetWindow,
  });

  //TODO what about click handling

  const key = columnMap[column.name];
  const valueWithHighlighting = useHighlighting(
    column.valueFormatter(row[key]),
    searchPattern,
  );

  return (
    <div className={classBase} tabIndex={-1}>
      <span data-icon="draggable" />
      {valueWithHighlighting}
    </div>
  );
};
