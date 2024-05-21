import { useMemo } from "react";
import { FilterValueChangeHandler, InlineFilter } from "@finos/vuu-filters";
import { SimulTable } from "../../Table/SIMUL.examples";

let displaySequence = 0;

export const SimpleInlineFilters = () => {
  const inlineFilter = useMemo(() => {
    const onChange: FilterValueChangeHandler = (column, value) => {
      console.log(`apply filter to column ${column.name} using value ${value}`);
    };
    return <InlineFilter onChange={onChange} />;
  }, []);

  return (
    <SimulTable
      customHeader={inlineFilter}
      height="100%"
      tableName="instrumentsExtended"
    />
  );
};
SimpleInlineFilters.displaySequence = displaySequence++;
