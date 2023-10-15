import {
  Flexbox,
  FlexboxLayout,
  LayoutProvider,
  registerComponent,
  View,
} from "@finos/vuu-layout";
import { ContextPanel } from "@finos/vuu-shell";
import { TableNext } from "@finos/vuu-table";
import {
  ColumnSettingsPanel,
  TableSettingsPanel,
} from "@finos/vuu-table-extras";
import { GroupColumnDescriptor, TableConfig } from "@finos/vuu-datagrid-types";
import { CSSProperties, useCallback, useMemo, useState } from "react";
import { useSchemas, useTableConfig, useTestDataSource } from "../utils";
import { GroupHeaderCellNext } from "@finos/vuu-table";
import { defaultValueFormatter } from "@finos/vuu-utils";

import "./TableNext.examples.css";

let displaySequence = 1;

export const DefaultTableNextArrayData = () => {
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
      renderBufferSize={5}
      width={723}
    />
  );
};
DefaultTableNextArrayData.displaySequence = displaySequence++;

export const EditableTableNextArrayData = () => {
  const { config, dataSource } = useTableConfig({
    columnConfig: {
      bbg: {
        editable: true,
        type: {
          name: "string",
          renderer: {
            name: "input-cell",
            rules: [
              { name: "vuu-case", value: "upper" },
              {
                name: "vuu-pattern",
                value: "^.{5,8}$",
                message: "Value must contain between 5 and 8 characters",
              },
            ],
          },
        },
      },
      currency: {
        editable: true,
        type: {
          name: "string",
          renderer: {
            name: "dropdown-cell",
            values: ["CAD", "EUR", "GBP", "GBX", "USD"],
          },
        },
      },
    },
    rangeChangeRowset: "full",
    table: { module: "SIMUL", table: "instruments" },
  });

  return (
    <TableNext
      config={{
        ...config,
        rowSeparators: true,
      }}
      dataSource={dataSource}
      height={645}
      renderBufferSize={10}
      width={723}
    />
  );
};
EditableTableNextArrayData.displaySequence = displaySequence++;

export const TableNextVuuInstruments = () => {
  const { schemas } = useSchemas();
  const { config, dataSource, error } = useTestDataSource({
    // bufferSize: 1000,
    schemas,
  });

  const [tableConfig] = useState<TableConfig>(config);

  if (error) {
    return error;
  }

  return (
    <TableNext
      config={tableConfig}
      dataSource={dataSource}
      height={645}
      renderBufferSize={50}
      width={715}
    />
  );
};
TableNextVuuInstruments.displaySequence = displaySequence++;

export const FlexLayoutTables = () => {
  const { typeaheadHook: _1, ...config1 } = useTableConfig({
    renderBufferSize: 0,
  });
  const { typeaheadHook: _2, ...config2 } = useTableConfig({
    renderBufferSize: 20,
  });
  const { typeaheadHook: _3, ...config3 } = useTableConfig({
    renderBufferSize: 50,
  });
  const { typeaheadHook: _4, ...config4 } = useTableConfig({
    renderBufferSize: 100,
  });
  return (
    <LayoutProvider>
      <FlexboxLayout
        style={{ flexDirection: "column", width: "100%", height: "100%" }}
      >
        <FlexboxLayout resizeable style={{ flexDirection: "row", flex: 1 }}>
          <View resizeable style={{ flex: 1 }}>
            <TableNext {...config1} />
          </View>

          <View resizeable style={{ flex: 1 }}>
            <TableNext {...config2} />
          </View>
        </FlexboxLayout>
        <FlexboxLayout resizeable style={{ flexDirection: "row", flex: 1 }}>
          <View resizeable style={{ flex: 1 }}>
            <TableNext {...config3} />
          </View>

          <View resizeable style={{ flex: 1 }}>
            <TableNext {...config4} />
          </View>
        </FlexboxLayout>
      </FlexboxLayout>
    </LayoutProvider>
  );
};
FlexLayoutTables.displaySequence = displaySequence++;

export const TableNextInLayoutWithContextPanel = () => {
  useMemo(() => {
    registerComponent("ColumnSettings", ColumnSettingsPanel, "view");
    registerComponent("TableSettings", TableSettingsPanel, "view");
  }, []);
  const {
    typeaheadHook: _,
    config,
    ...props
  } = useTableConfig({
    rangeChangeRowset: "full",
    table: { module: "SIMUL", table: "instruments" },
  });

  const handleConfigChange = useCallback((tableConfig: TableConfig) => {
    console.log("config changed");
  }, []);

  return (
    <LayoutProvider>
      <FlexboxLayout style={{ height: 645, width: "100%" }}>
        <TableNext
          {...props}
          config={config}
          onConfigChange={handleConfigChange}
          renderBufferSize={30}
        />
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

export const AutoTableNextBasketDesign = () => {
  const {
    typeaheadHook: _,
    config: configProp,
    ...props
  } = useTableConfig({
    rangeChangeRowset: "delta",
    table: { module: "SIMUL", table: "basketDesign" },
  });

  const [config, setConfig] = useState(configProp);

  const handleConfigChange = (config: TableConfig) => {
    setConfig(config);
  };

  return (
    <TableNext
      {...props}
      config={{
        ...config,
        rowSeparators: true,
        zebraStripes: true,
      }}
      onConfigChange={handleConfigChange}
      renderBufferSize={50}
    />
  );
};
AutoTableNextBasketDesign.displaySequence = displaySequence++;

export const AutoTableNextBasket = () => {
  const {
    typeaheadHook: _,
    config: configProp,
    ...props
  } = useTableConfig({
    count: 4,
    rangeChangeRowset: "delta",
    table: { module: "SIMUL", table: "basket" },
  });

  const [config, setConfig] = useState(configProp);

  const handleConfigChange = (config: TableConfig) => {
    setConfig(config);
  };

  console.log({ config });

  return (
    <TableNext
      {...props}
      config={{
        ...config,
        rowSeparators: true,
        zebraStripes: true,
      }}
      onConfigChange={handleConfigChange}
      renderBufferSize={50}
    />
  );
};
AutoTableNextBasket.displaySequence = displaySequence++;

export const AutoTableNextBasketOrders = () => {
  const {
    typeaheadHook: _,
    config: configProp,
    ...props
  } = useTableConfig({
    rangeChangeRowset: "delta",
    table: { module: "SIMUL", table: "basketOrders" },
  });

  const [config, setConfig] = useState(configProp);

  const handleConfigChange = (config: TableConfig) => {
    setConfig(config);
  };

  return (
    <TableNext
      {...props}
      config={{
        ...config,
        rowSeparators: true,
        zebraStripes: true,
      }}
      onConfigChange={handleConfigChange}
      renderBufferSize={50}
    />
  );
};
AutoTableNextBasketOrders.displaySequence = displaySequence++;

export const AutoTableNextBasketDefinitions = () => {
  const {
    typeaheadHook: _,
    config: configProp,
    ...props
  } = useTableConfig({
    count: 5,
    rangeChangeRowset: "delta",
    table: { module: "SIMUL", table: "basketDefinitions" },
  });

  const [config, setConfig] = useState(configProp);

  const handleConfigChange = (config: TableConfig) => {
    setConfig(config);
  };

  return (
    <TableNext
      {...props}
      config={{
        ...config,
        rowSeparators: true,
        zebraStripes: true,
      }}
      onConfigChange={handleConfigChange}
      renderBufferSize={50}
    />
  );
};
AutoTableNextBasketDefinitions.displaySequence = displaySequence++;

export const GroupHeaderCellNextOneColumn = () => {
  const column: GroupColumnDescriptor = useMemo(() => {
    const valueFormatter = defaultValueFormatter;
    return {
      groupConfirmed: true,
      key: 0,
      label: "group-column",
      name: "group-column",
      isGroup: true,
      columns: [
        {
          key: 1,
          name: "currency",
          label: "currency",
          valueFormatter,
          width: 100,
        },
      ],
      valueFormatter,
      width: 150,
    };
  }, []);
  const handleRemoveColumn = useCallback((column) => {
    console.log("remove column");
  }, []);

  return (
    <div
      style={
        {
          "--header-height": "24px",
        } as CSSProperties
      }
    >
      <GroupHeaderCellNext
        column={column}
        onRemoveColumn={handleRemoveColumn}
      />
    </div>
  );
};
GroupHeaderCellNextOneColumn.displaySequence = displaySequence++;

export const GroupHeaderCellNextTwoColumn = () => {
  const column: GroupColumnDescriptor = useMemo(() => {
    const valueFormatter = defaultValueFormatter;
    return {
      groupConfirmed: true,
      key: 0,
      label: "group-column",
      name: "group-column",
      isGroup: true,
      columns: [
        {
          key: 1,
          name: "currency",
          label: "currency",
          valueFormatter,
          width: 100,
        },
        {
          key: 2,
          name: "exchange",
          label: "exchange",
          valueFormatter,
          width: 100,
        },
      ],
      valueFormatter,
      width: 200,
    };
  }, []);
  const handleRemoveColumn = useCallback((column) => {
    console.log(`remove column ${column.name}`);
  }, []);

  return (
    <div
      style={
        {
          "--header-height": "24px",
        } as CSSProperties
      }
    >
      <GroupHeaderCellNext
        column={column}
        onRemoveColumn={handleRemoveColumn}
      />
    </div>
  );
};
GroupHeaderCellNextTwoColumn.displaySequence = displaySequence++;

export const GroupHeaderCellNextThreeColumn = () => {
  const valueFormatter = defaultValueFormatter;

  const [column, setColumn] = useState<GroupColumnDescriptor>({
    groupConfirmed: true,
    key: 0,
    label: "group-column",
    name: "group-column",
    isGroup: true,
    columns: [
      {
        key: 1,
        name: "currency",
        label: "currency",
        valueFormatter,
        width: 100,
      },
      {
        key: 2,
        name: "exchange",
        label: "exchange",
        valueFormatter,
        width: 100,
      },
      {
        key: 3,
        name: "price",
        label: "proce",
        valueFormatter,
        width: 100,
      },
    ],
    valueFormatter,
    width: 250,
  });
  const handleRemoveColumn = useCallback((column) => {
    console.log(`remove column ${column.name}`);
  }, []);

  return (
    <Flexbox
      style={
        {
          flexDirection: "row",
          width: 400,
          height: 50,
          "--header-height": "24px",
        } as CSSProperties
      }
    >
      <div data-resizeable style={{ flex: "1 1 auto", overflow: "hidden" }}>
        <GroupHeaderCellNext
          className="vuuFullWidthExample"
          column={column}
          onRemoveColumn={handleRemoveColumn}
        />
      </div>
      <div data-resizeable style={{ background: "yellow", flex: 1 }} />
    </Flexbox>
  );
};
GroupHeaderCellNextThreeColumn.displaySequence = displaySequence++;

export const GroupHeaderCellNextThreeColumnFixedWidth = () => {
  const valueFormatter = defaultValueFormatter;

  const [column, setColumn] = useState<GroupColumnDescriptor>({
    groupConfirmed: true,
    key: 0,
    label: "group-column",
    name: "group-column",
    isGroup: true,
    columns: [
      {
        key: 1,
        name: "currency",
        label: "currency",
        valueFormatter,
        width: 100,
      },
      {
        key: 2,
        name: "exchange",
        label: "exchange",
        valueFormatter,
        width: 100,
      },
      {
        key: 3,
        name: "price",
        label: "proce",
        valueFormatter,
        width: 100,
      },
    ],
    valueFormatter,
    width: 250,
  });
  const handleRemoveColumn = useCallback((column) => {
    console.log(`remove column ${column.name}`);
  }, []);

  return (
    <div data-resizeable style={{ width: 300, overflow: "hidden" }}>
      <GroupHeaderCellNext
        className="vuuFullWidthExample"
        column={column}
        onRemoveColumn={handleRemoveColumn}
      />
    </div>
  );
};
GroupHeaderCellNextThreeColumnFixedWidth.displaySequence = displaySequence++;
