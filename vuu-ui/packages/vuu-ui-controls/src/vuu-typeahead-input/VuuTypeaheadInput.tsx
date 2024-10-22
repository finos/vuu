import type {
  SuggestionProvider,
  TableSchemaTable,
} from "@finos/vuu-data-types";
import type { CommitHandler } from "@finos/vuu-utils";
import { ComboBox, Option } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { useVuuTypeaheadInput } from "./useVuuTypeaheadInput";

import vuuTypeaheadInputCss from "./VuuTypeaheadInput.css";

const classBase = "vuuTypeaheadInput";

export interface VuuTypeaheadInputProps {
  column: string;
  onCommit: CommitHandler<HTMLInputElement>;
  suggestionProvider?: SuggestionProvider;
  table: TableSchemaTable;
}

export const VuuTypeaheadInput = ({
  column,
  onCommit,
  table,
}: VuuTypeaheadInputProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-typeahead-input",
    css: vuuTypeaheadInputCss,
    window: targetWindow,
  });
  const {
    inputProps,
    onChange,
    onOpenChange,
    onSelectionChange,
    open,
    ref,
    typeaheadValues,
    value,
  } = useVuuTypeaheadInput({
    column,
    onCommit,
    table,
  });
  return (
    <ComboBox
      className={classBase}
      inputProps={inputProps}
      onChange={onChange}
      onOpenChange={onOpenChange}
      onSelectionChange={onSelectionChange}
      open={open}
      ref={ref}
      value={value}
    >
      {typeaheadValues.map((state) => (
        <Option value={state} key={state} />
      ))}
    </ComboBox>
  );
};
