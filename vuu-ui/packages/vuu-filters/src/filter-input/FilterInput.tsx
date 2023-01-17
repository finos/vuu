import { Filter } from "@finos/vuu-filter-types";
import { Button } from "@salt-ds/core";
import { HTMLAttributes } from "react";
import { SuggestionConsumer, useCodeMirrorEditor } from "./useCodeMirrorEditor";

import "./FilterInput.css";

const classBase = "vuuFilterInput";

export interface FilterInputProps
  extends SuggestionConsumer,
    HTMLAttributes<HTMLDivElement> {
  existingFilter?: Filter;
  onSubmitFilter?: (
    filter: Filter | undefined,
    filterQuery: string,
    filterName?: string
  ) => void;
}

export const FilterInput = ({
  existingFilter,
  onSubmitFilter,
  suggestionProvider,
  ...props
}: FilterInputProps) => {
  const { editorRef, clearInput } = useCodeMirrorEditor({
    existingFilter,
    onSubmitFilter,
    suggestionProvider,
  });

  return (
    <div {...props} className={classBase}>
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
