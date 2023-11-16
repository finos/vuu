import { InstrumentSearch } from "@finos/vuu-ui-controls";
import { getAllSchemas, SimulTableName, vuuModule } from "@finos/vuu-data-test";
import { useTestDataSource } from "../utils";
import { useMemo } from "react";

let displaySequence = 1;

export const DefaultInstrumentSearch = () => {
  const dataSource = useMemo(
    () => vuuModule<SimulTableName>("SIMUL").createDataSource("instruments"),
    []
  );
  return (
    <InstrumentSearch
      autoFocus
      dataSource={dataSource}
      style={{ height: 400, width: 250 }}
    />
  );
};

DefaultInstrumentSearch.displaySequence = displaySequence++;

export const InstrumentSearchVuuInstruments = () => {
  const { dataSource, error } = useTestDataSource({
    schemas: getAllSchemas(),
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
