import { InstrumentSearch } from "@finos/vuu-ui-controls";
import { useTableConfig } from "../utils";

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
