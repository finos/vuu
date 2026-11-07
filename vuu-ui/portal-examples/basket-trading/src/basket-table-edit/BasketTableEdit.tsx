import {
  ContextMenuProvider,
  type MenuActionHandler,
  type MenuBuilder,
} from "@vuu-ui/vuu-context-menu";
import {
  DataEditingProvider,
  DirectEditSession,
} from "@vuu-ui/vuu-data-editing";
import { Table, type TableProps } from "@vuu-ui/vuu-table";
import type {
  TableContextMenuOptions,
  TableMenuLocation,
} from "@vuu-ui/vuu-table-types";
import { registerComponent } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";
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
