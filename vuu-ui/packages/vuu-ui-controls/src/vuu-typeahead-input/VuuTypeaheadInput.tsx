import { ComboBox, Option } from "@salt-ds/core";
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

export interface VuuTypeaheadInputProps extends VuuTypeaheadInputHookProps {
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
  table,
}: VuuTypeaheadInputProps) => {
  console.log(
    `[VuuTypeaheadInput] minCharacterCountToTriggerSuggestions=${minCharacterCountToTriggerSuggestions}`,
  );

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

  // need latest version of salt combobox
  // const defaultHighlightedIndex =
  //   highlightFirstSuggestion === false ? -1 : undefined;

  return (
    <ComboBox
      className={cx(classBase, className)}
      // defaultHighlightedIndex={defaultHighlightedIndex}
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
