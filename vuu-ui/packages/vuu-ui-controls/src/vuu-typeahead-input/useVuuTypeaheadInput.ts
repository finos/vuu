import { PillInputProps } from "@salt-ds/core/dist-types/pill-input";
import { useTypeaheadSuggestions } from "@vuu-ui/vuu-data-react";
import { TableSchemaTable } from "@vuu-ui/vuu-data-types";
import type { TypeaheadParams } from "@vuu-ui/vuu-protocol-types";
import {
  dispatchKeyboardEvent,
  getVuuTable,
  useStateRef,
  NO_DATA_MATCH,
  type CommitHandler,
} from "@vuu-ui/vuu-utils";
import {
  ComponentPropsWithoutRef,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEventHandler,
  type RefCallback,
  type SyntheticEvent,
} from "react";

const meetsMinTextLengthThreshold = (value: string, minLength: number) =>
  value.length >= minLength;

export interface VuuTypeaheadInputHookProps {
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
  /**
   * When suggestions are displayed, should first option be highlighted ?
   * Highlighted option will be selected if Enter pressed. If this option
   * is not applied and no suggestion is highlighted, Enter will commit
   * current text. This will be desirable if filter operator  will be
   * 'contains', not if filter operator will be '='.
   */
  highlightFirstSuggestion?: boolean;
  inputProps?: PillInputProps["inputProps"];
  /**
   * If zero, suggestions will be shown even without any text input.
   * Suggestions will be displayed on click, or, if focused via keynoard,
   * on ArrowDown.
   * If n, where n > 0, then n characters must be typed before suggestion
   * list will be fetched.
   */
  minCharacterCountToTriggerSuggestions?: 0 | 1 | 2 | 3;
  onCommit: CommitHandler<HTMLInputElement>;
  table: TableSchemaTable;
}

const defaultFreeTextWarning =
  "Please select a value from the list of suggestions. If no suggestions match your text, then the value is not valid. If you believe this should be a valid value, please reach out to the support team";

export const useVuuTypeaheadInput = ({
  allowFreeInput = true,
  column,
  freeTextWarning,
  highlightFirstSuggestion = true,
  inputProps: inputPropsProp,
  minCharacterCountToTriggerSuggestions = 1,
  onCommit,
  table,
}: VuuTypeaheadInputHookProps) => {
  const NO_FREE_TEXT = useMemo(
    () => [freeTextWarning ?? defaultFreeTextWarning],
    [freeTextWarning],
  );
  const [valueRef, setValue] = useStateRef("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [typeaheadValues, setTypeaheadValues] = useState<string[]>([]);
  const getSuggestions = useTypeaheadSuggestions();
  const pendingListFocusRef = useRef(false);

  const { current: value } = valueRef;
  const commitTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLInputElement>>(
    (evt) => {
      const { current: value } = valueRef;
      if (evt.key === "Enter" && value !== "") {
        if (allowFreeInput) {
          commitTimeout.current = setTimeout(() => {
            onCommit?.(evt, value, "text-input");
            setOpen(false);
            commitTimeout.current = null;
          }, 200);
        } else {
          setTypeaheadValues(NO_FREE_TEXT);
        }
      } else if (evt.key === "Enter" && value === "") {
        console.log("ENTER no value");
      }
    },
    [NO_FREE_TEXT, allowFreeInput, onCommit, valueRef],
  );

  const callbackRef = useCallback<RefCallback<HTMLDivElement>>((el) => {
    rootRef.current = el;
    const input = el?.querySelector("input") ?? null;
    inputRef.current = input;
  }, []);

  useEffect(() => {
    if (table) {
      const vuuTable = getVuuTable(table);
      if (
        meetsMinTextLengthThreshold(
          value,
          minCharacterCountToTriggerSuggestions,
        )
      ) {
        const params: TypeaheadParams = value
          ? [vuuTable, column, value]
          : [vuuTable, column];
        console.log(
          `[useVuuTypeaheadInput] get suggestions matching ${value} ...`,
        );
        getSuggestions(params)
          .then((suggestions) => {
            console.log(`... ${JSON.stringify(suggestions)}`);
            if (suggestions === false) {
              // TODO is this right
              setTypeaheadValues([]);
            } else if (suggestions.length === 0 && value) {
              setTypeaheadValues((values) =>
                // Do not update if we have already set suggestions to the no free text warning
                values === NO_FREE_TEXT ? NO_FREE_TEXT : NO_DATA_MATCH,
              );
            } else {
              setTypeaheadValues(suggestions);
              if (pendingListFocusRef.current && inputRef.current) {
                // This is a workaround for the fact that ComboBox does not automatically
                // highlight first list item when items have been populated dynamically.
                // This has been raised as a bug.
                //TODO this is failing to work correctly in new version of cypress
                dispatchKeyboardEvent(inputRef.current, "keydown", "ArrowUp");
              }
            }
            pendingListFocusRef.current = false;
          })
          .catch((err) => {
            console.error("Error getting suggestions", err);
          });
      } else {
        setTypeaheadValues([]);
      }
    }
  }, [
    table,
    column,
    getSuggestions,
    value,
    NO_FREE_TEXT,
    minCharacterCountToTriggerSuggestions,
  ]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (evt) => {
      const { value: newValue } = evt.target;
      const { current: value } = valueRef;
      if (value === "" && newValue) {
        setOpen(true);
        const input = rootRef.current?.querySelector("input");
        if (input && highlightFirstSuggestion) {
          pendingListFocusRef.current = true;
        }
      } else if (newValue === "" && value) {
        // treat clear value as a commit event
        onCommit(evt, "");
      }
      setValue(newValue);
    },
    [highlightFirstSuggestion, onCommit, setValue, valueRef],
  );

  const handleSelectionChange = (
    evt: SyntheticEvent,
    [newSelected]: string[],
  ) => {
    if (commitTimeout.current) {
      clearTimeout(commitTimeout.current);
      commitTimeout.current = null;
    }
    setValue(newSelected);
    onCommit(
      evt as SyntheticEvent<HTMLInputElement>,
      newSelected,
      "typeahead-suggestion",
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && valueRef.current === "") {
      // ignore this, don't open dropdown unless user has typed at least one character
      setOpen(newOpen);
    } else {
      setOpen(newOpen);
    }
  };

  const inputProps: ComponentPropsWithoutRef<"input"> = {
    ...inputPropsProp,
    autoComplete: "off",
  };

  const [noFreeText] = NO_FREE_TEXT;
  return {
    inputProps,
    noFreeText,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onOpenChange: handleOpenChange,
    onSelectionChange: handleSelectionChange,
    open,
    ref: callbackRef,
    typeaheadValues,
    value: valueRef.current,
  };
};
