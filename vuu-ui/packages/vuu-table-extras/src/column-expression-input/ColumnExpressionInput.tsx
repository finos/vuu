import { HTMLAttributes, memo } from "react";
import { ColumnDefinitionExpression } from "./column-language-parser";
import {
  ExpressionSuggestionConsumer,
  useColumnExpressionEditor,
} from "./useColumnExpressionEditor";

import "./ColumnExpressionInput.css";

const classBase = "vuuColumnExpressionInput";

export interface ColumnExpressionInputProps
  extends ExpressionSuggestionConsumer,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  onChange?: (source: string) => void;
  onSubmitExpression?: (
    source: string,
    expression: ColumnDefinitionExpression | undefined
  ) => void;
  source?: string;
}

export const ColumnExpressionInput = memo(
  ({
    onChange,
    onSubmitExpression,
    source = "",
    suggestionProvider,
  }: ColumnExpressionInputProps) => {
    const { editorRef } = useColumnExpressionEditor({
      onChange,
      onSubmitExpression,
      source,
      suggestionProvider,
    });

    return <div className={`${classBase}`} ref={editorRef} />;
  },
  (prevProps, newProps) => {
    return prevProps.source === newProps.source;
  }
);
ColumnExpressionInput.displayName = "ColumnExpressionInput";
