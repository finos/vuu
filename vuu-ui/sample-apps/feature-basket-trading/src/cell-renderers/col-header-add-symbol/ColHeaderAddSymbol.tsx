import { registerComponent } from "@finos/vuu-utils";
import { Button } from "@salt-ds/core";
import { SetPropsAction, useLayoutProviderDispatch } from "@finos/vuu-layout";
import { MouseEventHandler, useCallback } from "react";
import "./ColHeaderAddSymbol.css";
import { InstrumentSearchProps } from "packages/vuu-ui-controls/src";

const classBase = "vuuColHeaderAddSymbol";

export const ColHeaderAddSymbol = () => {
  const dispatchLayoutAction = useLayoutProviderDispatch();

  const handleClick = useCallback<MouseEventHandler>(
    (e) => {
      e.stopPropagation();
      dispatchLayoutAction({
        type: "set-props",
        path: "#context-panel",
        props: {
          expanded: true,
          content: {
            type: "InstrumentSearch",
            props: {
              TableProps: {
                allowDragDrop: "drag-copy",
                id: "basket-instruments",
              },
              table: { module: "BASKET", table: "basketConstituent" },
            } as InstrumentSearchProps,
          },
          title: "Add Ticker",
        },
      } as SetPropsAction);
    },
    [dispatchLayoutAction]
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
  {}
);
