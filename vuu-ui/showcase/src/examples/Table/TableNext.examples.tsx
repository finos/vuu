import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import {
  FlexboxLayout,
  LayoutProvider,
  SetPropsAction,
  useLayoutProviderDispatch,
} from "@finos/vuu-layout";
import { ContextPanel } from "@finos/vuu-shell";
import { TableNext } from "@finos/vuu-table";
import { useCallback } from "react";
import { useTableConfig } from "../utils";

let displaySequence = 1;

export const DefaultTableNext = () => {
  const { typeaheadHook: _, ...config } = useTableConfig({
    columnCount: 10,
    count: 1000,
    rangeChangeRowset: "full",
  });

  return (
    <TableNext {...config} height={645} renderBufferSize={0} width={715} />
  );
};
DefaultTableNext.displaySequence = displaySequence++;

export const TableNextInLayoutWithContextPanel = () => {
  const { typeaheadHook: _, ...config } = useTableConfig({
    columnCount: 10,
    count: 1000,
    rangeChangeRowset: "full",
  });

  return (
    <LayoutProvider>
      <FlexboxLayout style={{ height: 645, width: 715 }}>
        <TableNext {...config} renderBufferSize={0} />
        <ContextPanel id="context-panel" overlay></ContextPanel>
      </FlexboxLayout>
    </LayoutProvider>
  );
};
TableNextInLayoutWithContextPanel.displaySequence = displaySequence++;

export const AutoTableNext = () => {
  const dispatchLayoutAction = useLayoutProviderDispatch();
  const {
    typeaheadHook: _,
    config,
    ...props
  } = useTableConfig({
    count: 1000,
    lazyData: false,
    rangeChangeRowset: "full",
    table: { module: "SIMUL", table: "instruments" },
  });

  const handleShowColumnSettings = useCallback(
    (column?: KeyedColumnDescriptor) => {
      dispatchLayoutAction({
        type: "set-props",
        path: "#context-panel",
        props: {
          expanded: true,
          context: "column-settings",
          column,
        },
      } as SetPropsAction);
    },
    [dispatchLayoutAction]
  );

  const handleConfigChange = useCallback((...args) => {
    console.log(`config change`, {
      args,
    });
  }, []);

  return (
    <TableNext
      {...props}
      config={{
        ...config,
        selectionBookendWidth: 4,
      }}
      renderBufferSize={0}
      onConfigChange={handleConfigChange}
      onShowConfigEditor={handleShowColumnSettings}
    />
  );
};
AutoTableNext.displaySequence = displaySequence++;
