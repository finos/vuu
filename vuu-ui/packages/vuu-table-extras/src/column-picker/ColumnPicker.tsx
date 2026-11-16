import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import cx from "clsx";
import { ForwardedRef, forwardRef, HTMLAttributes } from "react";

import { ListBoxProps } from "@salt-ds/core";
import { ColumnPickerHookProps, useColumnPicker } from "./useColumnPicker";

import { ItemPicker } from "@vuu-ui/vuu-ui-controls";
import columnPickerCss from "./ColumnPicker.css";
import { ColumnSetHeader } from "../column-sets/ColumnSetHeader";

const classBase = "vuuColumnPicker";
export const classBaseListItem = "vuuColumnPickerListItem";

export interface ColumnPickerProps
  extends
    ColumnPickerHookProps,
    Pick<ListBoxProps<ColumnDescriptor>, "selected" | "onSelectionChange">,
    HTMLAttributes<HTMLDivElement> {}

const NO_SELECTION: ColumnDescriptor[] = [] as const;

export const ColumnPicker = forwardRef(function ColumnPicker(
  {
    columnModel,
    columnSetModel,
    className,
    onSelectionChange,
    selected = NO_SELECTION,
    ...htmlAttributes
  }: ColumnPickerProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-column-picker",
    css: columnPickerCss,
    window: targetWindow,
  });

  const {
    allItems,
    selectedItems,
    oneOrMoreColumnsIsCalculated,
    handleSelectedItemsChange,
  } = useColumnPicker({
    columnModel: columnModel,
  });

  return (
    <ItemPicker
      {...htmlAttributes}
      className={cx(classBase, className, {
        [`${classBase}-withCalculated`]: oneOrMoreColumnsIsCalculated,
      })}
      allItems={allItems}
      header={
        columnSetModel ? (
          <ColumnSetHeader columnSetModel={columnSetModel} />
        ) : undefined
      }
      selectedItems={selectedItems}
      itemTypeName="column"
      onSelectedItemsChange={handleSelectedItemsChange}
      ref={forwardedRef}
    />
  );
});
