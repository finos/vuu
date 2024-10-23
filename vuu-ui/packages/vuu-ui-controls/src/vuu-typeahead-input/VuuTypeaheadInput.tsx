import type { TableSchemaTable } from "@finos/vuu-data-types";
import { NO_DATA_MATCH, type CommitHandler } from "@finos/vuu-utils";
import { ComboBox, Option } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { useVuuTypeaheadInput } from "./useVuuTypeaheadInput";

import vuuTypeaheadInputCss from "./VuuTypeaheadInput.css";

const classBase = "vuuTypeaheadInput";
const [noMatchingData] = NO_DATA_MATCH;

export interface VuuTypeaheadInputProps {
  /**
   * Allows a text string to be submitted that does not match any suggestion
   * Defaults to true
   */
  allowFreeInput?: boolean;
  column: string;
  /**
   * A warning to display to the user if allowFreeText is false and they attempt
   * to commit text which does not match any suggestions. A default message will
   * be shown if not provided
   */
  freeTextWarning?: string;
  onCommit: CommitHandler<HTMLInputElement>;
  table: TableSchemaTable;
}

export const VuuTypeaheadInput = ({
  allowFreeInput,
  column,
  freeTextWarning,
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
    noFreeText,
    onChange,
    onKeyDown,
    onOpenChange,
    onSelectionChange,
    open,
    ref,
    typeaheadValues,
    value,
  } = useVuuTypeaheadInput({
    allowFreeInput,
    column,
    freeTextWarning,
    onCommit,
    table,
  });

  console.log(`render with values ${typeaheadValues.join(",")}`);
  return (
    <ComboBox
      className={classBase}
      inputProps={inputProps}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onOpenChange={onOpenChange}
      onSelectionChange={onSelectionChange}
      open={open}
      ref={ref}
      value={value}
    >
      {typeaheadValues.map((state) => (
        <Option
          className="vuuTypeaheadOption"
          value={state}
          key={state}
          disabled={state === noMatchingData || state === noFreeText}
        />
      ))}
    </ComboBox>
  );
};
