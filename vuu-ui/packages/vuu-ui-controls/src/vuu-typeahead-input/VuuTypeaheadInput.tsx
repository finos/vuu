import { ComboBox, Option } from "@salt-ds/core";
import { PillInputProps } from "@salt-ds/core/dist-types/pill-input";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type { TableSchemaTable } from "@vuu-ui/vuu-data-types";
import { NO_DATA_MATCH, type CommitHandler } from "@vuu-ui/vuu-utils";
import cx from "clsx";
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
  className?: string;
  column: string;
  /**
   * A warning to display to the user if allowFreeText is false and they attempt
   * to commit text which does not match any suggestions. A default message will
   * be shown if not provided
   */
  freeTextWarning?: string;
  /**
   * When suggestions are displayed, should first option be highlighted ?
   * Highlighted option will be selected if Enter pressed. If this option
   * is not applied and no suggestion is highlighted, Enter will commit
   * current text. This will be desirable if filter operator  will be
   * 'contains', not if filter operator will be '='.
   */
  highlightFirstSuggestion?: boolean;
  inputProps?: PillInputProps["inputProps"];
  onCommit: CommitHandler<HTMLInputElement>;
  table: TableSchemaTable;
}

export const VuuTypeaheadInput = ({
  allowFreeInput,
  className,
  column,
  freeTextWarning,
  highlightFirstSuggestion,
  inputProps: inputPropsProp,
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
    highlightFirstSuggestion,
    inputProps: inputPropsProp,
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
