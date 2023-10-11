import { isCharacterKey } from "@finos/vuu-utils";
import { KeyboardEvent as ReactKeyboardEvent, useCallback } from "react";
import { cellIsTextInput } from "./table-dom-utils";

export interface CellEditingHookProps {
  navigate: () => void;
}

export const useCellEditing = ({ navigate }: CellEditingHookProps) => {
  const commitHandler = useCallback(() => {
    navigate();
  }, [navigate]);

  const editInput = useCallback(
    (evt: ReactKeyboardEvent<HTMLElement>) => {
      const cellEl = evt.target as HTMLDivElement;
      const input = cellEl.querySelector("input");
      if (input) {
        input.focus();
        input.select();
      }
      // TODO dergister on blur
      // TODO need a custom event
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore commit is a custom event fired by vuu inputs
      cellEl.addEventListener("vuu-commit", commitHandler, true);
    },
    [commitHandler]
  );

  const focusInput = useCallback(
    (evt: ReactKeyboardEvent<HTMLElement>) => {
      const cellEl = evt.target as HTMLDivElement;
      const input = cellEl.querySelector("input");
      if (input) {
        input.focus();
        input.select();
      }
      cellEl.addEventListener("vuu-commit", commitHandler, true);
    },
    [commitHandler]
  );

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLElement>) => {
      if (cellIsTextInput(e.target as HTMLDivElement)) {
        if (isCharacterKey(e.key)) {
          editInput(e);
        } else if (e.key === "Enter") {
          focusInput(e);
        }
      }
    },
    [editInput, focusInput]
  );

  return {
    onKeyDown: handleKeyDown,
  };
};
