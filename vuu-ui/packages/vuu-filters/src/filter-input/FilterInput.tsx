import { Filter } from "@finos/vuu-filter-types";
import { Button } from "@salt-ds/core";
import { HTMLAttributes } from "react";
import {
  filterSubmissionHandler,
  SuggestionConsumer,
  useCodeMirrorEditor,
} from "./useCodeMirrorEditor";

import "./FilterInput.css";

const classBase = "vuuFilterInput";

export interface FilterInputProps
  extends SuggestionConsumer,
    HTMLAttributes<HTMLDivElement> {
  iconName?: string;
  existingFilter?: Filter;
  namedFilters?: Map<string, string>;
  onSubmitFilter?: filterSubmissionHandler;
}

export const FilterInput = ({
  existingFilter,
  iconName = "filter",
  namedFilters,
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
      <Button
        className={`${classBase}-FilterButton`}
        data-icon={iconName}
        tabIndex={-1}
      />
      <div className={`${classBase}-Editor`} ref={editorRef} />
      <Button
        className={`${classBase}-ClearButton`}
        data-icon="close-circle"
        onClick={clearInput}
      />
    </div>
  );
};
