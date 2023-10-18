import { useCallback, useState } from "react";
import {
  ColumnExpressionInput,
  ColumnExpressionInputProps,
  Expression,
  useColumnExpressionSuggestionProvider,
} from "@finos/vuu-table-extras";

import { JsonTable } from "@finos/vuu-datatable";

import {} from "@finos/vuu-utils";
import { useAutoLoginToVuuServer } from "../utils";

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
  const [isValid] = useState(false);
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
      // const isValidExpression = isCompleteExpression(source);
      // console.log(`is valid ${isValidExpression}`);
      // setIsValid(isCompleteExpression(source));
    },
    []
  );

  return (
    <>
      <ColumnExpressionInput
        onChange={handleChange}
        onSubmitExpression={handleSubmitExpression}
        source={source}
        suggestionProvider={suggestionProvider}
      />
      <span>isValid {isValid}</span>
      <br />
      <br />
      {/* <div>{source}</div> */}
      <JsonTable source={expression as any} height={400} />
    </>
  );
};
DefaultColumnExpressionInput.displaySequence = displaySequence++;
