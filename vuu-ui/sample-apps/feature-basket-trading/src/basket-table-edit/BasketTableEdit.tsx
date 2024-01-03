import { Table, TableProps } from "@finos/vuu-table";
import {
  ContextMenuConfiguration,
  ContextMenuProvider,
} from "@finos/vuu-popups";
import { ColHeaderAddSymbol } from "../cell-renderers";

import "./BasketTableEdit.css";

const classBase = "vuuBasketTableEdit";

if (typeof ColHeaderAddSymbol !== "function") {
  console.warn("BasketTableEdit not all custom cell renderers are available");
}

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
