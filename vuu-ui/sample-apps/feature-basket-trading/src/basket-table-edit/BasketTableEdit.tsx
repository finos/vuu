import {
  ContextMenuConfiguration,
  ContextMenuProvider,
} from "@finos/vuu-popups";
import { Table, TableProps } from "@finos/vuu-table";
import { registerComponent } from "@finos/vuu-utils";
import { ColHeaderAddSymbol } from "../cell-renderers";

import "./BasketTableEdit.css";

registerComponent(
  "col-header-add-symbol",
  ColHeaderAddSymbol,
  "column-header-content-renderer",
  {},
);

const classBase = "vuuBasketTableEdit";

export interface BasketTableEditProps extends TableProps {
  contextMenuConfig: ContextMenuConfiguration;
}

export const BasketTableEdit = ({
  contextMenuConfig,
  ...props
}: BasketTableEditProps) => {
  return (
    <ContextMenuProvider {...contextMenuConfig}>
      <Table
        {...props}
        allowDragDrop="drop-only"
        id="basket-constituents"
        renderBufferSize={20}
        className={classBase}
        rowHeight={21}
      />
    </ContextMenuProvider>
  );
};
