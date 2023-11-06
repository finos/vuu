import { TableConfig } from "@finos/vuu-datagrid-types";
import { TableNext } from "@finos/vuu-table";
import { useState } from "react";
import { useTableConfig } from "../utils";

let displaySequence = 1;

export const Basket = () => {
  const {
    typeaheadHook: _,
    config: configProp,
    ...props
  } = useTableConfig({
    table: { module: "BASKET", table: "basket" },
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
Basket.displaySequence = displaySequence++;

export const BasketConstituent = () => {
  const {
    typeaheadHook: _,
    config: configProp,
    ...props
  } = useTableConfig({
    table: { module: "BASKET", table: "basketConstituent" },
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
BasketConstituent.displaySequence = displaySequence++;

export const BasketTrading = () => {
  const {
    typeaheadHook: _,
    config: configProp,
    ...props
  } = useTableConfig({
    table: { module: "BASKET", table: "basketTrading" },
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
BasketTrading.displaySequence = displaySequence++;

export const BasketTradingConstituent = () => {
  const {
    typeaheadHook: _,
    config: configProp,
    ...props
  } = useTableConfig({
    table: { module: "BASKET", table: "basketTradingConstituent" },
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
BasketTradingConstituent.displaySequence = displaySequence++;
