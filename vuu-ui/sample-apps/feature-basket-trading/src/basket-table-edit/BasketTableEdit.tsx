import {
  DataEditingProvider,
  DirectEditSession,
} from "@vuu-ui/vuu-data-editing";
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
import { useMemo } from "react";

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
  dataSource,
  ...props
}: BasketTableEditProps) => {
  // Basket constituents are edited directly on the source table, there is
  // no staged edit session.
  const editSession = useMemo(
    () => new DirectEditSession({ dataSource }),
    [dataSource],
  );
  return (
    <ContextMenuProvider {...contextMenuConfig}>
      <DataEditingProvider editSession={editSession}>
        <Table
          {...props}
          allowDragDrop="drop-only"
          dataSource={dataSource}
          id="basket-constituents"
          renderBufferSize={20}
          className={classBase}
          rowHeight={21}
        />
      </DataEditingProvider>
    </ContextMenuProvider>
  );
};
