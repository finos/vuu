import type { ListBoxProps } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import cx from "clsx";
import { type ForwardedRef, forwardRef, type HTMLAttributes } from "react";
import { type ColumnPickerHookProps, useColumnPicker } from "./useColumnPicker";
import { ItemPicker } from "@vuu-ui/vuu-ui-controls";

import columnPickerCss from "./ColumnPicker.css";

const classBase = "vuuColumnPicker";
export const classBaseListItem = "vuuColumnPickerListItem";

export interface ColumnPickerProps
  extends
  ColumnPickerHookProps,
  Pick<ListBoxProps<ColumnDescriptor>, "selected" | "onSelectionChange">,
  HTMLAttributes<HTMLDivElement> { }

const NO_SELECTION: ColumnDescriptor[] = [] as const;

export const ColumnPicker = forwardRef(function ColumnPicker(
  {
    columnModel,
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
      selectedItems={selectedItems}
      itemTypeName="column"
      onSelectedItemsChange={handleSelectedItemsChange}
      onSelectionChange={onSelectionChange}
      ref={forwardedRef}
      selected={selected}
    />
  );
});
