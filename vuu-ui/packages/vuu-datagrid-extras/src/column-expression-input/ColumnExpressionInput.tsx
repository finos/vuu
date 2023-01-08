import { Filter } from "@finos/vuu-filters";
import { HTMLAttributes } from "react";
import {
  SuggestionConsumer2,
  useColumnExpressionEditor,
} from "./useColumnExpressionEditor";
import { Button } from "@salt-ds/core";

import "./ColumnExpressionInput.css";
import { Expression } from "./column-language-parser";

const classBase = "vuuColumnExpressionInput";

export interface ColumnExpressionInputProps
  extends SuggestionConsumer2,
    HTMLAttributes<HTMLDivElement> {
  existingFilter?: Filter;
  onSubmitExpression?: (
    expression: Expression | undefined,
    source: string
  ) => void;
}

export const ColumnExpressionInput = ({
  onSubmitExpression,
  suggestionProvider,
}: ColumnExpressionInputProps) => {
  const { editorRef, clearInput } = useColumnExpressionEditor({
    onSubmitExpression,
    suggestionProvider,
  });

  return (
    <div className={classBase} style={{ width: 600 }}>
      <Button className={`${classBase}-FilterButton`} data-icon="filter" />
      <div className={`${classBase}-Editor`} ref={editorRef} />
      <Button
        className={`${classBase}-ClearButton`}
        data-icon="close-circle"
        onClick={clearInput}
      />
    </div>
  );
};
