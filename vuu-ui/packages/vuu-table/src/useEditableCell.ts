import { queryClosest } from "@vuu-ui/vuu-utils";
import { KeyboardEventHandler, useCallback } from "react";

export const useEditableCell = () => {
  return useCallback<KeyboardEventHandler<HTMLDivElement>>((evt) => {
    if (evt.key === "Enter") {
      const el = evt.target as HTMLElement;
      const inputElement = el.querySelector("input");
      if (inputElement !== document.activeElement) {
        inputElement?.focus();
      }
    } else if (evt.key === "Escape") {
      const input = queryClosest<HTMLInputElement>(evt.target, "input");
      const cell = queryClosest(input, ".vuuTableCell");
      if (cell) {
        cell.tabIndex = 0;
        cell.focus();
        evt.stopPropagation();
      }
    }
  }, []);
};
