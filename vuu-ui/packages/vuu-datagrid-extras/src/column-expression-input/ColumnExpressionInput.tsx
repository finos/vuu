import { HTMLAttributes, useCallback } from "react";
import {
  ExpressionSuggestionConsumer,
  useColumnExpressionEditor,
} from "./useColumnExpressionEditor";

import "./ColumnExpressionInput.css";
import { Expression } from "./column-language-parser";

const classBase = "vuuColumnExpressionInput";

export interface ColumnExpressionInputProps
  extends ExpressionSuggestionConsumer,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  onChange?: (source: string, expression: Expression | undefined) => void;
  onSubmitExpression?: (
    source: string,
    expression: Expression | undefined
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
