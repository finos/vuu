import {
  SetPropsAction,
  useLayoutProviderDispatch,
  useViewContext,
} from "@finos/vuu-layout";
import { VuuShellLocation, registerComponent } from "@finos/vuu-utils";
import { Button } from "@salt-ds/core";
import type { DataSource } from "@finos/vuu-data-types";
import type { TableSearchProps } from "@finos/vuu-ui-controls/src";
import { MouseEventHandler, useCallback, useMemo } from "react";

import "./ColHeaderAddSymbol.css";

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
            type: "InstrumentSearch",
            props: {
              TableProps: {
                allowDragDrop: "drag-copy",
                id: "basket-instruments",
              },
              dataSource,
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

registerComponent(
  "col-header-add-symbol",
  ColHeaderAddSymbol,
  "column-header-content-renderer",
  {},
);
