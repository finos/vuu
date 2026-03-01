import {
  dispatchCustomEvent,
  isCharacterKey,
  queryClosest,
} from "@vuu-ui/vuu-utils";
import {
  FocusEventHandler,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent,
  useCallback,
} from "react";
import { cellIsTextInput, getAriaCellPos } from "./table-dom-utils";
import { FocusCell } from "./useCellFocus";

export interface CellEditingHookProps {
  focusCell: FocusCell;
  navigate: () => void;
}

export const useCellEditing = ({
  focusCell,
  navigate,
}: CellEditingHookProps) => {
  const commitHandler = useCallback(() => {
    navigate();
  }, [navigate]);

  const editModeHandler = useCallback(
    (e: Event) => {
      // console.log(`[useCellEditing]  editModeHandler ${e.type}`);
      const tableCell = queryClosest<HTMLDivElement>(
        e.target,
        ".vuuTableCell",
        true,
      );
      if (e.type === "vuu-exit-edit-mode") {
        tableCell.classList.remove("vuuEditing");
        // console.log("shift focus back to cell");
        const cellPos = getAriaCellPos(tableCell);
        focusCell(cellPos, true);
        // console.log({ tableCell });
      } else {
        // console.log("what do we do in edit mode ?");
        tableCell.classList.add("vuuEditing");
      }
    },
    [focusCell],
  );

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
    [],
  );

  const focusInput = useCallback(
    (evt: MouseEvent<HTMLElement> | ReactKeyboardEvent<HTMLElement>) => {
      const cellEl = evt.target as HTMLDivElement;
      const input = cellEl.querySelector("input");
      if (input) {
        input.focus();
        input.select();
        // need to put the input into edit mode
        dispatchCustomEvent(input, "vuu-begin-edit");
      }
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLElement>) => {
      // console.log(`[useCellEditing] handleKeyDown `);

      const el = e.target as HTMLElement;
      if (cellIsTextInput(el)) {
        if (isCharacterKey(e.key)) {
          editInput(e);
        } else if (e.key === "Enter") {
          focusInput(e);
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
      // console.log(
      //   `[useCellEditing] handleBlur, unregisters the vuu-commit handler `,
      // );
      const el = e.target as HTMLElement;
      el.removeEventListener("vuu-commit", commitHandler, true);
      el.removeEventListener("vuu-enter-edit-mode", editModeHandler, true);
      el.removeEventListener("vuu-exit-edit-mode", editModeHandler, true);
    },
    [commitHandler, editModeHandler],
  );

  const handleFocus = useCallback<FocusEventHandler>(
    (e) => {
      // console.log(
      //   `[useCellEditing] handleFocus, registers the vuu-commit handler `,
      // );
      const el = e.target as HTMLElement;
      el.addEventListener("vuu-commit", commitHandler, true);
      el.addEventListener("vuu-enter-edit-mode", editModeHandler, true);
      el.addEventListener("vuu-exit-edit-mode", editModeHandler, true);
    },
    [commitHandler, editModeHandler],
  );

  return {
    onBlur: handleBlur,
    onDoubleClick: handleDoubleClick,
    onFocus: handleFocus,
    onKeyDown: handleKeyDown,
  };
};
