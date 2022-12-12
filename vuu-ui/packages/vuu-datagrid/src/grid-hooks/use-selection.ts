import { useCallback, useRef } from "react";
import { metadataKeys } from "@vuu-ui/vuu-utils";

const { IDX, SELECTED } = metadataKeys;

export const SINGLE = "single";
export const CHECKBOX = "checkbox";
export const MULTI = "multi";
export const EXTENDED = "extended";

export interface SelectionHookProps {
  onChange: (selected: number[] | undefined) => void;
  selection: "none" | "single" | "multi" | "checkbox" | "extended";
}

export const useSelection = ({
  onChange,
  selection = SINGLE,
}: SelectionHookProps) => {
  const singleSelect = selection === SINGLE;
  const multiSelect = selection === MULTI || selection.startsWith(CHECKBOX);
  const extendedSelect = selection === EXTENDED;
  const lastActive = useRef(-1);
  const selected = useRef<number[]>([]);

  const handleSelectionChange = useCallback(
    ({
      row,
      rangeSelect,
      keepExistingSelection: preserveExistingSelection,
    }) => {
      const { [IDX]: idx, [SELECTED]: isSelected } = row;
      const { current: active } = lastActive;
      const { current: currentSelected } = selected;
      const inactiveRange = active === -1;
      const actsLikeSingleSelect =
        singleSelect ||
        (extendedSelect &&
          !preserveExistingSelection &&
          (!rangeSelect || inactiveRange));
      const actsLikeMultiSelect =
        multiSelect ||
        (extendedSelect && preserveExistingSelection && !rangeSelect);

      let newSelected;
      if (actsLikeSingleSelect && isSelected) {
        newSelected = [];
      } else if (actsLikeSingleSelect) {
        newSelected = [idx];
      } else if (actsLikeMultiSelect && isSelected) {
        newSelected = currentSelected?.filter((i) => i !== idx);
      } else if (actsLikeMultiSelect) {
        newSelected = currentSelected?.concat(idx);
      } else if (extendedSelect) {
        const [from, to] = idx > active ? [active, idx] : [idx, active];
        newSelected = currentSelected?.slice();
        for (let i = from; i <= to; i++) {
          if (!currentSelected?.includes(i)) {
            newSelected.push(i);
          }
        }
      }

      selected.current = newSelected ?? [];
      lastActive.current = idx;

      if (onChange) {
        onChange(newSelected);
      }
    },
    [extendedSelect, multiSelect, onChange, singleSelect]
  );

  return handleSelectionChange;
};
