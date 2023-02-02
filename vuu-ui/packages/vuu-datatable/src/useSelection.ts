import { metadataKeys } from "@finos/vuu-utils";
import { useCallback, useRef } from "react";
import { RowClickHandler, TableSelectionModel } from "./dataTableTypes";

const { IDX, SELECTED } = metadataKeys;

export interface SelectionHookProps {
  selectionModel: TableSelectionModel;
  setSelected: (selected: number[] | undefined) => void;
}

export const useSelection = ({
  selectionModel,
  setSelected,
}: SelectionHookProps) => {
  const singleSelect = selectionModel === "single";
  const multiSelect =
    selectionModel === "extended" || selectionModel === "checkbox";
  const lastActive = useRef(-1);
  const selected = useRef<number[]>([]);

  const handleSelectionChange: RowClickHandler = useCallback(
    (index, row, rangeSelect, keepExistingSelection) => {
      const { [IDX]: idx, [SELECTED]: isSelected } = row;
      const { current: active } = lastActive;
      const { current: currentSelected } = selected;
      const inactiveRange = active === -1;
      const actsLikeSingleSelect =
        singleSelect ||
        (multiSelect &&
          !keepExistingSelection &&
          (!rangeSelect || inactiveRange));

      let newSelected;
      if (actsLikeSingleSelect && isSelected) {
        newSelected = [];
      } else if (actsLikeSingleSelect) {
        newSelected = [idx];
      } else if (!rangeSelect) {
        if (isSelected) {
          newSelected = currentSelected?.filter((i) => i !== idx);
        } else {
          newSelected = currentSelected?.concat(idx);
        }
      } else if (multiSelect) {
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

      if (setSelected) {
        setSelected(newSelected);
      }
    },
    [multiSelect, setSelected, singleSelect]
  );

  return handleSelectionChange;
};
