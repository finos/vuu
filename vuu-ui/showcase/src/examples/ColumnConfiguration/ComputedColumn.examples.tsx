import React, { useCallback, useEffect, useState } from "react";
import {
  ColumnExpressionInput,
  ColumnExpressionInputProps,
  Expression,
  isCompleteExpression,
  useColumnExpressionSuggestionProvider,
} from "@finos/vuu-table-extras";

import { JsonTable } from "@finos/vuu-datatable";

import {
  authenticate as vuuAuthenticate,
  connectToServer,
} from "@finos/vuu-data";
import {} from "@finos/vuu-utils";

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
  const [source, setSource] = useState<string>("");
  const [isValid, setIsValid] = useState(false);
  const suggestionProvider = useColumnExpressionSuggestionProvider({
    columns,
    table,
  });

  useEffect(() => {
    const connect = async () => {
      const authToken = (await vuuAuthenticate("steve", "xyz")) as string;
      connectToServer("127.0.0.1:8090/websocket", authToken);
    };
    connect();
  }, []);

  const handleSubmitExpression: ColumnExpressionInputProps["onSubmitExpression"] =
    useCallback((source: string, expression: Expression | undefined) => {
      console.log({ expression, source });
      setExpression(expression);
      setSource(source);
    }, []);

  const handleChange: ColumnExpressionInputProps["onChange"] = useCallback(
    (source: string, expression: Expression | undefined) => {
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
        suggestionProvider={suggestionProvider}
      />
      <span>isValid {isValid}</span>
      <br />
      <br />
      <div>{JSON.stringify(expression)}</div>
      <br />
      {/* <div>{source}</div> */}
      <JsonTable source={expression?.toJSON?.()} height={400} />
    </>
  );
};
DefaultColumnExpressionInput.displaySequence = displaySequence++;
