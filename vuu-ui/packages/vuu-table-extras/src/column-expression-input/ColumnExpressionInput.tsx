import { HTMLAttributes } from "react";
import {
  ExpressionSuggestionConsumer,
  useColumnExpressionEditor,
} from "./useColumnExpressionEditor";

import "./ColumnExpressionInput.css";
import { ColumnDefinitionExpression } from "./column-language-parser";

const classBase = "vuuColumnExpressionInput";

export interface ColumnExpressionInputProps
  extends ExpressionSuggestionConsumer,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  onChange?: (
    source: string,
    expression: ColumnDefinitionExpression | undefined
  ) => void;
  onSubmitExpression?: (
    source: string,
    expression: ColumnDefinitionExpression | undefined
  ) => void;
}

export const ColumnExpressionInput = ({
  onChange,
  onSubmitExpression,
  suggestionProvider,
}: ColumnExpressionInputProps) => {
  const { editorRef } = useColumnExpressionEditor({
    onChange,
    onSubmitExpression,
    suggestionProvider,
  });

  return <div className={`${classBase}`} ref={editorRef} />;
};
