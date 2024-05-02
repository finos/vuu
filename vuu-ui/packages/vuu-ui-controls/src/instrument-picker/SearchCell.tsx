import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { TableCellRendererProps } from "@finos/vuu-table-types";
import { registerComponent } from "@finos/vuu-utils";

import searchCellCss from "./SearchCell.css";

const classBase = "vuuSearchCell";

// export to avoid tree shaking, component is not consumed directly
export const SearchCell = ({
  column,
  columnMap,
  row,
}: TableCellRendererProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-search-cell",
    css: searchCellCss,
    window: targetWindow,
  });

  //TODO what about click handling

  const key = columnMap[column.name];
  const value = row[key];

  return (
    <div className={classBase} tabIndex={-1}>
      <span data-icon="draggable" />
      {value}
    </div>
  );
};

registerComponent("search-cell", SearchCell, "cell-renderer", {
  serverDataType: "private",
});
