import { isCharacterKey } from "@finos/vuu-utils";
import {
  FocusEventHandler,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent,
  useCallback,
} from "react";
import { cellIsTextInput } from "./table-dom-utils";

export interface CellEditingHookProps {
  navigate: () => void;
}

export const useCellEditing = ({ navigate }: CellEditingHookProps) => {
  const commitHandler = useCallback(() => {
    navigate();
  }, [navigate]);

  const editInput = useCallback(
    (evt: MouseEvent<HTMLElement> | ReactKeyboardEvent<HTMLElement>) => {
      const cellEl = evt.target as HTMLDivElement;
      const input = cellEl.matches("input")
        ? (cellEl as HTMLInputElement)
        : cellEl.querySelector("input");

      if (input) {
        input.focus();
        input.select();
      }
    },
    []
  );

  const focusInput = useCallback(
    (evt: MouseEvent<HTMLElement> | ReactKeyboardEvent<HTMLElement>) => {
      const cellEl = evt.target as HTMLDivElement;
      const input = cellEl.querySelector("input");
      if (input) {
        input.focus();
        input.select();
      }
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLElement>) => {
      const el = e.target as HTMLElement;
      if (cellIsTextInput(el)) {
        if (isCharacterKey(e.key)) {
          editInput(e);
        } else if (e.key === "Enter") {
          focusInput(e);
        }
      }
    },
    [editInput, focusInput]
  );

  const handleDoubleClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      const el = e.target as HTMLElement;
      if (el.matches("input") || el.querySelector("input")) {
        editInput(e);
        e.stopPropagation();
      }
    },
    [editInput]
  );

  const handleBlur = useCallback<FocusEventHandler>(
    (e) => {
      const el = e.target as HTMLElement;
      el.removeEventListener("vuu-commit", commitHandler, true);
    },
    [commitHandler]
  );

  const handleFocus = useCallback<FocusEventHandler>(
    (e) => {
      const el = e.target as HTMLElement;
      el.addEventListener("vuu-commit", commitHandler, true);
    },
    [commitHandler]
  );

  return {
    onBlur: handleBlur,
    onDoubleClick: handleDoubleClick,
    onFocus: handleFocus,
    onKeyDown: handleKeyDown,
  };
};
