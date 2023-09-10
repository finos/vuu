import { FlexboxLayout, LayoutProvider } from "@finos/vuu-layout";
import { ContextPanel } from "@finos/vuu-shell";
import { TableNext } from "@finos/vuu-table";
import { TableConfig } from "@finos/vuu-datagrid-types";
import { useCallback, useState } from "react";
import { useTableConfig } from "../utils";

let displaySequence = 1;

export const DefaultTableNext = () => {
  const {
    typeaheadHook: _,
    config: configProp,
    ...props
  } = useTableConfig({
    rangeChangeRowset: "full",
    table: { module: "SIMUL", table: "instruments" },
  });

  const [config, setConfig] = useState<TableConfig>(configProp);

  const handleConfigChange = useCallback((config: TableConfig) => {
    setConfig(config);
  }, []);

  return (
    <TableNext
      {...props}
      config={config}
      height={645}
      onConfigChange={handleConfigChange}
      renderBufferSize={0}
      width={715}
    />
  );
};
DefaultTableNext.displaySequence = displaySequence++;

export const TableNextInLayoutWithContextPanel = () => {
  const {
    typeaheadHook: _,
    config,
    ...props
  } = useTableConfig({
    rangeChangeRowset: "full",
    table: { module: "SIMUL", table: "instruments" },
  });

  return (
    <LayoutProvider>
      <FlexboxLayout style={{ height: 645, width: 715 }}>
        <TableNext {...props} config={config} renderBufferSize={0} />
        <ContextPanel id="context-panel" overlay></ContextPanel>
      </FlexboxLayout>
    </LayoutProvider>
  );
};
TableNextInLayoutWithContextPanel.displaySequence = displaySequence++;

export const AutoTableNext = () => {
  const {
    typeaheadHook: _,
    config: configProp,
    ...props
  } = useTableConfig({
    rangeChangeRowset: "full",
    table: { module: "SIMUL", table: "instruments" },
  });

  const [config, setConfig] = useState(configProp);

  const handleConfigChange = (config: TableConfig) => {
    console.log({ config });
    setConfig(config);
  };

  return (
    <TableNext
      {...props}
      config={{
        ...config,
      }}
      onConfigChange={handleConfigChange}
      renderBufferSize={0}
    />
  );
};
AutoTableNext.displaySequence = displaySequence++;
