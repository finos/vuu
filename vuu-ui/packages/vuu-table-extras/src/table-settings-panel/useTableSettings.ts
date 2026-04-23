import { TableDisplayAttributes } from "@vuu-ui/vuu-table-types";
import {
  queryClosest,
  useLayoutEffectSkipFirst,
  CommitHandler,
} from "@vuu-ui/vuu-utils";
import { MouseEvent, SyntheticEvent, useCallback, useState } from "react";
import { TableSettingsPanelProps } from "./TableSettingsPanel";

export type ColumnLike = {
  name: string;
};

export const useTableSettings = ({
  onDisplayAttributeChange,
  tableDisplayAttributes: tableDisplayAttributesProp,
}: TableSettingsPanelProps) => {
  const [tableDisplayAttributes, setDisplayTableAttributes] =
    useState<TableDisplayAttributes>(tableDisplayAttributesProp);

  const handleChangeColumnLabels = useCallback((evt: SyntheticEvent) => {
    const button = queryClosest<HTMLButtonElement>(evt.target, "button");
    if (button) {
      const value = parseInt(button.value);
      const columnFormatHeader =
        value === 0 ? undefined : value === 1 ? "capitalize" : "uppercase";
      setDisplayTableAttributes((state) => ({
        ...state,
        columnFormatHeader,
      }));
    }
  }, []);

  const handleChangeTableAttribute = useCallback(
    (evt: MouseEvent<HTMLButtonElement>) => {
      const button = queryClosest<HTMLButtonElement>(evt.target, "button");
      if (button) {
        const { ariaPressed, value } = button;
        setDisplayTableAttributes((state) => ({
          ...state,
          [value]: ariaPressed !== "true",
        }));
      }
    },
    [],
  );

  const handleCommitColumnWidth = useCallback<CommitHandler>((_, value) => {
    if (typeof value === "string") {
      const columnDefaultWidth = parseInt(value);
      if (!isNaN(columnDefaultWidth)) {
        setDisplayTableAttributes((state) => ({
          ...state,
          columnDefaultWidth,
        }));
      }
    }
  }, []);

  useLayoutEffectSkipFirst(() => {
    onDisplayAttributeChange?.(tableDisplayAttributes);
  }, [onDisplayAttributeChange, tableDisplayAttributes]);

  const columnLabelsValue =
    tableDisplayAttributes.columnFormatHeader === undefined
      ? 0
      : tableDisplayAttributes.columnFormatHeader === "capitalize"
        ? 1
        : 2;

  return {
    columnLabelsValue,
    onChangeColumnLabels: handleChangeColumnLabels,
    onChangeTableAttribute: handleChangeTableAttribute,
    onCommitColumnWidth: handleCommitColumnWidth,
    tableDisplayAttributes,
  };
};
