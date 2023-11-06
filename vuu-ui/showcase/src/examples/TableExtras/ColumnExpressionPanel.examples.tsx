import {
  ColumnExpressionPanel,
  ColumnExpressionSubmitHandler,
} from "@finos/vuu-table-extras";
import { useCallback } from "react";
import { useTableConfig } from "../utils";

const instrumentPrices = { module: "SIMUL", table: "instrumentPrices" };

let displaySequence = 1;

export const DefaultColumnExpressionPanel = () => {
  const { config: tableConfig } = useTableConfig({
    rangeChangeRowset: "full",
    table: instrumentPrices,
  });

  const handleChange = useCallback((columnName: string) => {
    console.log(columnName);
  }, []);

  const handleSubmitExpression = useCallback<ColumnExpressionSubmitHandler>(
    (columnName: string) => {
      console.log(columnName);
    },
    []
  );

  return (
    <div style={{ margin: 10, width: 300 }}>
      <ColumnExpressionPanel
        column={{ name: "::", serverDataType: "string" }}
        onChange={handleChange}
        onSubmitExpression={handleSubmitExpression}
        tableConfig={tableConfig}
        vuuTable={instrumentPrices}
      />
    </div>
  );
};
DefaultColumnExpressionPanel.displaySequence = displaySequence++;
