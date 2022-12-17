import { Filter } from "@finos/vuu-filters";
import { HTMLAttributes } from "react";
import {
  SuggestionConsumer2,
  useColumnExpressionEditor,
} from "./useColumnExpressionEditor";
import { Button } from "@heswell/uitk-core";

import "./ColumnExpressionInput.css";

const classBase = "vuuColumnExpressionInput";

export interface ColumnExpressionInputProps
  extends SuggestionConsumer2,
    HTMLAttributes<HTMLDivElement> {
  existingFilter?: Filter;
  onSubmitExpression?: (
    filter: Filter | undefined,
    filterQuery: string,
    filterName?: string
  ) => void;
}

export const ColumnExpressionInput = ({
  existingFilter,
  onSubmitExpression: onSubmitFilter,
  suggestionProvider,
}: ColumnExpressionInputProps) => {
  const { editorRef, clearInput } = useColumnExpressionEditor({
    existingFilter,
    onSubmitExpression: onSubmitFilter,
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
