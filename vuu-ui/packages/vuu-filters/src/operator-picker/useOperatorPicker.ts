import {
  ChangeEvent,
  SyntheticEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { dispatchKeyboardEvent } from "@vuu-ui/vuu-utils";
import { FilterClauseOp } from "@vuu-ui/vuu-filter-types";

export const useOperatorPicker = ({
  onSelect,
  value: valueProp,
}: {
  onSelect: (evt: SyntheticEvent, op: FilterClauseOp) => void;
  value: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  const [value, setValue] = useState(valueProp);
  // Options are filtered by typed text only, not by a selected value
  const [typedText, setTypedText] = useState("");

  const highlightFirstOption = useCallback(() => {
    if (ref.current) {
      const input = ref.current?.querySelector<HTMLInputElement>(
        'input[role="combobox"]',
      );
      if (input) {
        requestAnimationFrame(() => {
          dispatchKeyboardEvent(input, "keydown", "ArrowDown");
        });
      }
    }
  }, []);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setValue(value);
      setTypedText(value);
      if (openRef.current && value === "") {
        highlightFirstOption();
      }
    },
    [highlightFirstOption],
  );

  const handleSelectionChange = useCallback(
    (evt: SyntheticEvent, [newSelected]: FilterClauseOp[]) => {
      onSelect?.(evt, newSelected);
      setValue(newSelected ?? "");
      setTypedText("");
    },
    [onSelect],
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean, reason?: "manual" | "input" | "focus") => {
      openRef.current = isOpen;
      if (isOpen && reason === "focus") {
        setTypedText("");
        highlightFirstOption();
      }
    },
    [highlightFirstOption],
  );

  return {
    onChange: handleChange,
    onOpenChange: handleOpenChange,
    onSelectionChange: handleSelectionChange,
    ref,
    typedText,
    value: value.toString().trim(),
  };
};
