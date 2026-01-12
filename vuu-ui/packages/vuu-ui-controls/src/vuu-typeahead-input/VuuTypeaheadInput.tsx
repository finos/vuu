import { ComboBox, ComboBoxProps, Option } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { NO_DATA_MATCH } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import {
  useVuuTypeaheadInput,
  VuuTypeaheadInputHookProps,
} from "./useVuuTypeaheadInput";

import vuuTypeaheadInputCss from "./VuuTypeaheadInput.css";

const classBase = "vuuTypeaheadInput";
const [noMatchingData] = NO_DATA_MATCH;

export interface VuuTypeaheadInputProps
  extends VuuTypeaheadInputHookProps,
    Pick<ComboBoxProps, "selectOnTab"> {
  className?: string;
}

export const VuuTypeaheadInput = ({
  allowFreeInput,
  className,
  column,
  freeTextWarning,
  highlightFirstSuggestion,
  inputProps: inputPropsProp,
  minCharacterCountToTriggerSuggestions,
  onCommit,
  selectOnTab,
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
    highlightFirstSuggestion,
    inputProps: inputPropsProp,
    minCharacterCountToTriggerSuggestions,
    onCommit,
    table,
  });

  return (
    <ComboBox
      className={cx(classBase, className)}
      inputProps={inputProps}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onOpenChange={onOpenChange}
      onSelectionChange={onSelectionChange}
      open={open}
      ref={ref}
      selectOnTab={selectOnTab}
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
