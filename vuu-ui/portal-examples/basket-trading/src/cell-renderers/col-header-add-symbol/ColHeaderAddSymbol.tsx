import { Button } from "@salt-ds/core";
import { useSessionDataSource } from "@vuu-ui/vuu-data-react";
import { SetPropsAction, useLayoutProviderDispatch } from "@vuu-ui/vuu-layout";
import { TableSearch } from "@vuu-ui/vuu-ui-controls";
import type { TableSearchProps } from "@vuu-ui/vuu-ui-controls/src";
import { registerComponent, VuuShellLocation } from "@vuu-ui/vuu-utils";
import { MouseEventHandler, useCallback, useMemo } from "react";

import "./ColHeaderAddSymbol.css";

registerComponent("TableSearch", TableSearch, "view");

const classBase = "vuuColHeaderAddSymbol";

export const ColHeaderAddSymbol = () => {
  const dispatchLayoutAction = useLayoutProviderDispatch();
  const { getDataSource } = useSessionDataSource();

  const dataSource = useMemo(() => {
    const ds = getDataSource("data-source-basket-constituent");
    if (ds) {
      return ds;
    } else {
      throw Error(
        "ColHeaderAddSymbol expects Basket Constituent datasource to be available in session store",
      );
    }
  }, [getDataSource]);

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
      <Button
        appearance="solid"
        data-icon="add"
        onClick={handleClick}
        sentiment="neutral"
      />
    </span>
  );
};
