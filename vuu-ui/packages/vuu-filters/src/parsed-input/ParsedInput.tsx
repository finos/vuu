import { Filter } from "@finos/vuu-utils";
import { HTMLAttributes } from "react";
import {
  ISuggestionProvider,
  useCodeMirrorEditor,
} from "./useCodeMirrorEditor";

import "./ParsedInput.css";

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
  const editorRef = useCodeMirrorEditor({ onSubmitFilter, suggestionProvider });

  return (
    <div
      className="vuuFilterEditor"
      ref={editorRef}
      style={{ width: 600, height: 32 }}
    />
  );
};
