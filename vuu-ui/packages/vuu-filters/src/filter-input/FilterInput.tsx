import { Filter } from "@finos/vuu-filters";
import { HTMLAttributes } from "react";
import {
  ISuggestionProvider,
  useCodeMirrorEditor,
} from "./useCodeMirrorEditor";
import { Button } from "@heswell/uitk-core";

import "./FilterInput.css";

const classBase = "vuuFilterInput";

export interface FilterInputProps extends HTMLAttributes<HTMLDivElement> {
  existingFilter?: Filter;
  onSubmitFilter?: (
    filter: Filter | undefined,
    filterQuery: string,
    filterName?: string
  ) => void;
  suggestionProvider: ISuggestionProvider;
}

export const FilterInput = ({
  existingFilter,
  onSubmitFilter,
  suggestionProvider,
}: FilterInputProps) => {
  const { editorRef, clearInput } = useCodeMirrorEditor({
    existingFilter,
    onSubmitFilter,
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
