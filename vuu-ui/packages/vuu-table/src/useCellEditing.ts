import { isCharacterKey } from "@vuu-ui/vuu-utils";
import {
  FocusEventHandler,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent,
  useCallback,
} from "react";
import { cellIsTextInput, getCellDropdown } from "./table-dom-utils";

/**
 * Re-dispatch a keydown on a control that has just received focus, so the
 * control handles the key that moved focus into it.
 */
const forwardKeyDown = (
  target: HTMLElement,
  { key, code, shiftKey }: ReactKeyboardEvent<HTMLElement>,
) => {
  target.dispatchEvent(
    new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      code,
      key,
      shiftKey,
    }),
  );
};

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
      }
    },
    [],
  );

  const focusInput = useCallback(
    (evt: MouseEvent<HTMLElement> | ReactKeyboardEvent<HTMLElement>) => {
      const cellEl = evt.target as HTMLDivElement;
      const input = cellEl.querySelector("input");
      if (input) {
        input.focus();
      }
    },
    [],
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
      } else if (el.role === "cell") {
        const dropdown = getCellDropdown(el);
        if (dropdown) {
          if (e.key === "Enter") {
            // The Dropdown opens when it receives focus from its cell
            dropdown.focus();
          } else if (
            isCharacterKey(e.key) &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey
          ) {
            // As typing in an input cell starts editing, typing in a dropdown
            // cell opens the Dropdown at the first matching option.
            e.preventDefault();
            dropdown.focus();
            forwardKeyDown(dropdown, e);
          }
        }
      }
    },
    [editInput, focusInput],
  );

  const handleDoubleClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      const el = e.target as HTMLElement;
      if (el.matches("input") || el.querySelector("input")) {
        editInput(e);
        e.stopPropagation();
      }
    },
    [editInput],
  );

  const handleBlur = useCallback<FocusEventHandler>(
    (e) => {
      const el = e.target as HTMLElement;
      el.removeEventListener("vuu-commit", commitHandler, true);
    },
    [commitHandler],
  );

  const handleFocus = useCallback<FocusEventHandler>(
    (e) => {
      const el = e.target as HTMLElement;
      el.addEventListener("vuu-commit", commitHandler, true);
    },
    [commitHandler],
  );

  return {
    onBlur: handleBlur,
    onDoubleClick: handleDoubleClick,
    onFocus: handleFocus,
    onKeyDown: handleKeyDown,
  };
};
