import { useMemo } from "react";
import { FilterValueChangeHandler, InlineFilter } from "@finos/vuu-filters";
import { SimulTable } from "../../Table/SIMUL.examples";
import { LocalDataSourceProvider } from "@finos/vuu-data-test";

let displaySequence = 0;

const table = { module: "SIMUL", table: "instrumentsExtended" } as const;

export const SimpleInlineFilters = () => {
  const inlineFilter = useMemo(() => {
    const onChange: FilterValueChangeHandler = (column, value) => {
      console.log(`apply filter to column ${column.name} using value ${value}`);
    };
    return <InlineFilter onChange={onChange} table={table} />;
  }, []);

  return (
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <SimulTable
        customHeader={inlineFilter}
        height="100%"
        tableName={table.table}
      />
    </LocalDataSourceProvider>
  );
};
SimpleInlineFilters.displaySequence = displaySequence++;
