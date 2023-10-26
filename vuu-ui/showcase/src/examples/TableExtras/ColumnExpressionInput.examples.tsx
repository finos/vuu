import { useCallback, useState } from "react";
import {
  ColumnExpressionInput,
  ColumnExpressionInputProps,
  Expression,
  isCompleteExpression,
  useColumnExpressionSuggestionProvider,
} from "@finos/vuu-table-extras";

import { JsonTable } from "@finos/vuu-datatable";

import {} from "@finos/vuu-utils";
import { useAutoLoginToVuuServer } from "../utils";
import { Input } from "@salt-ds/core";

let displaySequence = 1;

const table = { module: "SIMUL", table: "instruments" };

const columns = [
  { name: "bbg", serverDataType: "string" } as const,
  { name: "description", serverDataType: "string" } as const,
  { name: "currency", serverDataType: "string" } as const,
  { name: "exchange", serverDataType: "string" } as const,
  { name: "price", serverDataType: "double" } as const,
  { name: "quantity", serverDataType: "int" } as const,
  { name: "filledQty", serverDataType: "int" } as const,
  { name: "lotSize", serverDataType: "int" } as const,
  { name: "exchangeRate", serverDataType: "double" } as const,
  { name: "isin", serverDataType: "string" } as const,
  { name: "ric", serverDataType: "string" } as const,
  { name: "ask", serverDataType: "double" } as const,
  { name: "bid", serverDataType: "double" } as const,
  { name: "i1", serverDataType: "int" } as const,
  { name: "i2", serverDataType: "int" } as const,
  { name: "i3", serverDataType: "int" } as const,
  { name: "orderId", serverDataType: "string" } as const,
];

export const DefaultColumnExpressionInput = () => {
  const [expression, setExpression] = useState<Expression>();
  const [source, setSource] = useState("");
  const [currentSource, setCurrentSource] = useState("");
  const [isValid, setIsValid] = useState(false);
  const suggestionProvider = useColumnExpressionSuggestionProvider({
    columns,
    table,
  });

  useAutoLoginToVuuServer();

  const handleSubmitExpression: ColumnExpressionInputProps["onSubmitExpression"] =
    useCallback((source: string, expression: Expression | undefined) => {
      console.log({ expression, source });
      setExpression(expression);
      setSource(source);
    }, []);

  const handleChange: ColumnExpressionInputProps["onChange"] = useCallback(
    (source: string) => {
      console.log(`source ${source}, expression ${expression}`);
      setCurrentSource(source);
      const isValidExpression = isCompleteExpression(source);
      console.log(`is valid ${isValidExpression}`);
      setIsValid(isValidExpression);
    },
    [expression]
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        padding: 24,
      }}
    >
      <div style={{ margin: 50 }}>{currentSource}</div>
      <Input style={{ width: 120 }} />
      <ColumnExpressionInput
        onChange={handleChange}
        onSubmitExpression={handleSubmitExpression}
        source={source}
        suggestionProvider={suggestionProvider}
      />
      <Input style={{ width: 120 }} />
      <div style={{ whiteSpace: "pre" }}>
        {JSON.stringify(expression, null, 2)}
      </div>
      <span>{`isValid ${isValid}`}</span>
      {/* <div>{source}</div> */}
      <JsonTable
        config={{
          columnSeparators: true,
          rowSeparators: true,
          zebraStripes: true,
        }}
        source={expression as any}
        height={400}
      />
    </div>
  );
};
DefaultColumnExpressionInput.displaySequence = displaySequence++;
