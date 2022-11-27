import { Filter } from "@finos/vuu-utils";
import { HTMLAttributes } from "react";
import {
  ISuggestionProvider,
  useCodeMirrorEditor,
} from "./useCodeMirrorEditor";
import { Button } from "@heswell/uitk-core";

import "./FilterInput.css";

const classBase = "vuuFilterInput";
export interface ParsedInputProps extends HTMLAttributes<HTMLDivElement> {
  onSubmitFilter?: (
    filter: Filter | undefined,
    filterQuery: string,
    filterName?: string
  ) => void;
  suggestionProvider: ISuggestionProvider;
}

export const ParsedInput = ({
  onSubmitFilter,
  suggestionProvider,
}: ParsedInputProps) => {
  const { editorRef, clearInput } = useCodeMirrorEditor({
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
