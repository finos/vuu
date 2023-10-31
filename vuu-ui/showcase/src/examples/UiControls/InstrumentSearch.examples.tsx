import { InstrumentSearch } from "@finos/vuu-ui-controls";
import { getAllSchemas } from "@finos/vuu-data-test";
import { useTableConfig, useTestDataSource } from "../utils";

let displaySequence = 1;

export const DefaultInstrumentSearch = () => {
  const { dataSource } = useTableConfig({
    dataSourceConfig: {
      columns: ["bbg", "description"],
    },
    table: { module: "SIMUL", table: "instruments" },
  });
  return (
    <InstrumentSearch
      dataSource={dataSource}
      style={{ height: 400, width: 250 }}
    />
  );
};

DefaultInstrumentSearch.displaySequence = displaySequence++;

export const InstrumentSearchVuuInstruments = () => {
  const schemas = getAllSchemas();
  const { dataSource, error } = useTestDataSource({
    // bufferSize: 1000,
    schemas,
  });

  if (error) {
    return error;
  }

  return (
    <InstrumentSearch
      dataSource={dataSource}
      searchColumns={["bbg", "description"]}
      style={{ height: 400, width: 250 }}
    />
  );
};

InstrumentSearchVuuInstruments.displaySequence = displaySequence++;
