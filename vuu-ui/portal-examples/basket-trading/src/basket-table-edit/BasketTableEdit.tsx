import { Table, TableProps } from "@vuu-ui/vuu-table";
import { registerComponent } from "@vuu-ui/vuu-utils";
import { ColHeaderAddSymbol } from "../cell-renderers";

import "./BasketTableEdit.css";
import {
  ContextMenuProvider,
  MenuActionHandler,
  MenuBuilder,
} from "@vuu-ui/vuu-context-menu";
import {
  TableContextMenuOptions,
  TableMenuLocation,
} from "@vuu-ui/vuu-table-types";

registerComponent(
  "col-header-add-symbol",
  ColHeaderAddSymbol,
  "column-header-content-renderer",
  {},
);

const classBase = "vuuBasketTableEdit";

export interface BasketTableEditProps extends TableProps {
  contextMenuConfig: {
    menuActionHandler: MenuActionHandler;
    menuBuilder: MenuBuilder<TableMenuLocation, TableContextMenuOptions>;
  };
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
