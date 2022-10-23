import { UIToken } from "@vuu-ui/datagrid-parsers/src/filter-parser/ui-tokens";
import { ForwardedRef, forwardRef, HTMLAttributes, RefObject } from "react";
import { TokenMirror } from "./TokenMirror";

import "./FilterInput.css";

const classBase = "vuuFilterInput";

export interface FilterInputProps extends HTMLAttributes<HTMLDivElement> {
  completion?: string;
  inputRef: RefObject<HTMLDivElement>;
  insertSymbol?: boolean;
  tokens: UIToken[];
}
export const FilterInput = forwardRef(function FilterInput(
  {
    completion,
    inputRef,
    insertSymbol,
    tokens,
    ...restProps
  }: FilterInputProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  return (
    <div className={classBase} ref={forwardedRef}>
      <TokenMirror
        tokens={tokens}
        completion={`${insertSymbol ?? ""}${completion ?? ""}`}
      />
      <div
        {...restProps}
        ref={inputRef}
        contentEditable
        className={`${classBase}-input`}
        spellCheck={false}
        tabIndex={0}
      />
    </div>
  );
});
