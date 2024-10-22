import { TypeaheadParams } from "@finos/vuu-protocol-types";
import { dispatchKeyboardEvent, getVuuTable } from "@finos/vuu-utils";
import {
  ChangeEventHandler,
  ComponentPropsWithoutRef,
  RefCallback,
  SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { VuuTypeaheadInputProps } from "./VuuTypeaheadInput";
import { useTypeaheadSuggestions } from "@finos/vuu-data-react";

const NO_DATA_MATCH = ["No matching data"];

export type VuuTypeaheadInputHookProps = Pick<
  VuuTypeaheadInputProps,
  "column" | "onCommit" | "table"
>;

export const useVuuTypeaheadInput = ({
  column,
  onCommit,
  table,
}: VuuTypeaheadInputHookProps) => {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [typeaheadValues, setTypeaheadValues] = useState<string[]>([]);
  const getSuggestions = useTypeaheadSuggestions();

  const callbackRef = useCallback<RefCallback<HTMLDivElement>>((el) => {
    rootRef.current = el;
  }, []);

  useEffect(() => {
    if (table) {
      const vuuTable = getVuuTable(table);
      if (value) {
        const params: TypeaheadParams = value
          ? [vuuTable, column, value]
          : [vuuTable, column];
        getSuggestions(params)
          .then((suggestions) => {
            if (suggestions === false) {
              // TODO is this right
              setTypeaheadValues([]);
            } else if (suggestions.length === 0 && value) {
              setTypeaheadValues(NO_DATA_MATCH);
            } else {
              setTypeaheadValues(suggestions);
            }
          })
          .catch((err) => {
            console.error("Error getting suggestions", err);
          });
      } else {
        setTypeaheadValues([]);
      }
    }
  }, [table, column, getSuggestions, value]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (evt) => {
    const { value: newValue } = evt.target;

    if (value === "" && newValue) {
      setOpen(true);
      const input = rootRef.current?.querySelector("input");
      if (input) {
        // This is a workaround for the fact that ComboBox does not automatically
        // highlight first list item when items have been populated dynamically.
        // This has been raised as a bug.
        setTimeout(() => {
          dispatchKeyboardEvent(input, "keydown", "ArrowUp");
        }, 150);
      }
    } else if (newValue === "" && value) {
      // treat clear value as a commit event
      onCommit(evt, "");
    }

    setValue(newValue);
  };

  const handleSelectionChange = (
    evt: SyntheticEvent,
    [newSelected]: string[],
  ) => {
    console.log(`useVuuTypeahead handleSelectionChange ${newSelected}`);
    setValue(newSelected);
    onCommit(
      evt as SyntheticEvent<HTMLInputElement>,
      newSelected,
      "typeahead-suggestion",
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && value === "") {
      // ignore this, don't open dropdown unless user has typed at least one character
    } else {
      setOpen(newOpen);
    }
  };

  const inputProps: ComponentPropsWithoutRef<"input"> = {
    autoComplete: "off",
  };

  return {
    inputProps,
    onChange: handleChange,
    onOpenChange: handleOpenChange,
    onSelectionChange: handleSelectionChange,
    open,
    ref: callbackRef,
    typeaheadValues,
    value,
  };
};
