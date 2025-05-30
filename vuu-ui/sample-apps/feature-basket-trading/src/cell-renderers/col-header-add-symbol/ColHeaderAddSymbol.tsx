import {
  SetPropsAction,
  useLayoutProviderDispatch,
  useViewContext,
} from "@vuu-ui/vuu-layout";
import { registerComponent, VuuShellLocation } from "@vuu-ui/vuu-utils";
import { Button } from "@salt-ds/core";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { TableSearchProps } from "@vuu-ui/vuu-ui-controls/src";
import { MouseEventHandler, useCallback, useMemo } from "react";
import { TableSearch } from "@vuu-ui/vuu-ui-controls";

import "./ColHeaderAddSymbol.css";

registerComponent("TableSearch", TableSearch, "view");

const classBase = "vuuColHeaderAddSymbol";

export const ColHeaderAddSymbol = () => {
  const dispatchLayoutAction = useLayoutProviderDispatch();
  const { loadSession } = useViewContext();

  const dataSource = useMemo(() => {
    const ds = loadSession?.("data-source-basket-constituent") as DataSource;
    if (ds) {
      return ds;
    } else {
      throw Error(
        "ColHeaderAddSymbol expects Basket Constituent datasource to be available in session store",
      );
    }
  }, [loadSession]);

  const handleClick = useCallback<MouseEventHandler>(
    (e) => {
      e.stopPropagation();
      dispatchLayoutAction({
        type: "set-props",
        path: `#${VuuShellLocation.ContextPanel}`,
        props: {
          expanded: true,
          content: {
            type: "TableSearch",
            props: {
              TableProps: {
                allowDragDrop: "drag-copy",
                config: {
                  columns: [{ name: "description" }],
                },
                dataSource,
                id: "basket-instruments",
              },
              searchColumns: ["description"],
            } as TableSearchProps,
          },
          title: "Add Ticker",
        },
      } as SetPropsAction);
    },
    [dataSource, dispatchLayoutAction],
  );

  return (
    <span className={classBase}>
      <Button variant="primary" data-icon="add" onClick={handleClick} />
    </span>
  );
};
