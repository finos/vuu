import { HTMLAttributes, memo } from "react";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ColumnDefinitionExpression } from "./column-language-parser";
import {
  ExpressionSuggestionConsumer,
  useColumnExpressionEditor,
} from "./useColumnExpressionEditor";

import colummExpressionInputCss from "./ColumnExpressionInput.css";

const classBase = "vuuColumnExpressionInput";

export type ColumnExpressionSubmitHandler = (
  source: string,
  expression: ColumnDefinitionExpression | undefined
) => void;

export interface ColumnExpressionInputProps
  extends ExpressionSuggestionConsumer,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  onChange?: (source: string) => void;
  onSubmitExpression?: ColumnExpressionSubmitHandler;
  source?: string;
}

export const ColumnExpressionInput = memo(
  ({
    onChange,
    onSubmitExpression,
    source = "",
    suggestionProvider,
  }: ColumnExpressionInputProps) => {
    const targetWindow = useWindow();
    useComponentCssInjection({
      testId: "vuu-column-expression-input",
      css: colummExpressionInputCss,
      window: targetWindow,
    });

    const { editorRef, onBlur } = useColumnExpressionEditor({
      onChange,
      onSubmitExpression,
      source,
      suggestionProvider,
    });

    return <div className={`${classBase}`} onBlur={onBlur} ref={editorRef} />;
  },
  (prevProps, newProps) => {
    return prevProps.source === newProps.source;
  }
);
ColumnExpressionInput.displayName = "ColumnExpressionInput";
