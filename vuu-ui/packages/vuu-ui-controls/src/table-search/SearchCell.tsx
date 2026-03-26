import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { useHighlighting } from "@vuu-ui/vuu-table";

import searchCellCss from "./SearchCell.css";

const classBase = "vuuSearchCell";

export const SearchCell = ({
  column,
  dataRow,
  searchPattern = "",
}: TableCellRendererProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-search-cell",
    css: searchCellCss,
    window: targetWindow,
  });

  //TODO what about click handling

  const valueWithHighlighting = useHighlighting(
    column.valueFormatter(dataRow[column.name]),
    searchPattern,
  );

  return (
    <div className={classBase} tabIndex={-1}>
      <span data-icon="draggable" />
      {valueWithHighlighting}
    </div>
  );
};
