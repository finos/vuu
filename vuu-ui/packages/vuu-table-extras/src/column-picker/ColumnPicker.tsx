import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  MouseEventHandler,
  RefCallback,
  useCallback,
  useMemo,
  useRef,
} from "react";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  DragDropProvider,
  getColumnLabel,
  reorderColumnItems,
  useSortable,
} from "@vuu-ui/vuu-utils";

import columnPickerCss from "./ColumnPicker.css";
import { Input, ListBox, Option, OptionProps } from "@salt-ds/core";
import {
  ColumPickerHookProps,
  SelectedColumnChangeType,
  useColumnPicker,
} from "./useColumnPicker";
import { IconButton } from "@vuu-ui/vuu-ui-controls";
import { useHighlighting } from "@vuu-ui/vuu-table";

const classBase = "vuuColumnPicker";
export const classBaseListItem = "vuuColumnPickerListItem";

export interface ColumnPickerProps
  extends ColumPickerHookProps,
    HTMLAttributes<HTMLDivElement> {}

const searchIcon = <span data-icon="search" />;
const NO_SELECTION: string[] = [] as const;

const useSorting = (id: string, index: number) => {
  const { handleRef: sortableHandleRef, ref: sortableRef } = useSortable({
    id,
    index,
  });

  const [handleRef, ref] = useMemo(() => {
    return [sortableHandleRef, sortableRef];
  }, [sortableHandleRef, sortableRef]);

  return {
    handleRef,
    ref,
  };
};

const SelectedColumnListItem = ({
  className: classNameProp,
  index,
  column: item,
  onRemove,
  searchPattern = "",
  ...optionProps
}: OptionProps & {
  index: number;
  column: ColumnDescriptor;
  onRemove: MouseEventHandler<HTMLButtonElement>;
  searchPattern?: Lowercase<string>;
}) => {
  const { handleRef, ref } = useSorting(item.name, index);
  const value = getColumnLabel(item as ColumnDescriptor);
  const valueWithHighlighting = useHighlighting(value, searchPattern);

  return (
    <Option
      {...optionProps}
      className={cx(classNameProp, classBaseListItem)}
      data-name={item.name}
      ref={ref}
    >
      <IconButton
        data-embedded
        appearance="transparent"
        icon="draggable"
        ref={handleRef}
        size={16}
      />
      <span className={`${classBase}-text`}>{valueWithHighlighting}</span>
      <IconButton
        className={`${classBaseListItem}-action`}
        data-embedded
        appearance="transparent"
        icon="cross"
        onClick={onRemove}
        size={16}
      />
    </Option>
  );
};

const AvailableColumnListItem = ({
  className: classNameProp,
  index,
  column: item,
  onAdd,
  searchPattern = "",
  ...optionProps
}: OptionProps & {
  index: number;
  column: ColumnDescriptor;
  onAdd: MouseEventHandler<HTMLButtonElement>;
  searchPattern?: Lowercase<string>;
}) => {
  const value = getColumnLabel(item as ColumnDescriptor);
  const valueWithHighlighting = useHighlighting(value, searchPattern);

  return (
    <Option
      {...optionProps}
      className={cx(classNameProp, classBaseListItem)}
      data-name={item.name}
    >
      <span className={`${classBase}-text`}>{valueWithHighlighting}</span>
      <IconButton
        className={`${classBaseListItem}-action`}
        data-embedded
        appearance="transparent"
        icon="plus"
        onClick={onAdd}
        size={16}
      />
    </Option>
  );
};

export const ColumnPicker = forwardRef(function ColumnPicker(
  {
    availableColumns: availableColumnsProp,
    className,
    defaultSelectedColumns,
    onChangeSelectedColumns,
    selectedColumns: selectedColumnsProp,
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

  const searchCallbackRef = useCallback<RefCallback<HTMLElement>>((el) => {
    setTimeout(() => {
      el?.querySelector("input")?.focus();
    }, 100);
  }, []);

  const {
    availableColumns,
    onAddItemToSelectedList,
    onChangeSearchInput,
    onRemoveItemFromSelectedList,
    searchState,
    selectedColumns,
  } = useColumnPicker({
    availableColumns: availableColumnsProp,
    defaultSelectedColumns,
    onChangeSelectedColumns,
    selectedColumns: selectedColumnsProp,
  });
  const listRef = useRef<HTMLDivElement>(null);

  const getOptionName = (option?: HTMLElement) => {
    if (option) {
      const { name } = option.dataset;
      if (name) {
        return name;
      }
    }
    throw Error("[ColumnPicker] list option has no data-name");
  };

  const handleDragEnd = useCallback(() => {
    setTimeout(() => {
      const listItems =
        listRef.current?.querySelectorAll<HTMLDivElement>(".saltOption");
      if (listItems) {
        const orderedColumnNames = Array.from(listItems).map(getOptionName);
        onChangeSelectedColumns?.(
          reorderColumnItems(selectedColumns, orderedColumnNames),
          SelectedColumnChangeType.ColumnsReordered,
        );
      }
    }, 300);
  }, [onChangeSelectedColumns, selectedColumns]);

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, className)}
      ref={forwardedRef}
    >
      <form className={`${classBase}-search`} role="search">
        <Input
          startAdornment={searchIcon}
          placeholder="Find column"
          ref={searchCallbackRef}
          value={searchState.searchText}
          onChange={onChangeSearchInput}
        />
      </form>

      <div className={`${classBase}-scrollContainer vuuScrollable`}>
        <div className={`${classBase}-sectionHeader`}>Columns in view</div>
        <DragDropProvider onDragEnd={handleDragEnd}>
          <ListBox
            className={`${classBase}-selectedList`}
            ref={listRef}
            selected={NO_SELECTION}
          >
            {selectedColumns.map((column, index) => (
              <SelectedColumnListItem
                column={column}
                index={index}
                key={column.name}
                onRemove={onRemoveItemFromSelectedList}
                searchPattern={
                  searchState.searchText.toLowerCase() as Lowercase<string>
                }
                value={column}
              />
            ))}
          </ListBox>
        </DragDropProvider>

        <div
          className={cx(
            `${classBase}-sectionHeader`,
            `${classBase}-availableHeader`,
          )}
        >
          Available columns
        </div>
        <ListBox
          className={`${classBase}-availableList`}
          selected={NO_SELECTION}
        >
          {availableColumns.map((column, index) => (
            <AvailableColumnListItem
              column={column}
              index={index}
              key={column.name}
              onAdd={onAddItemToSelectedList}
              searchPattern={
                searchState.searchText.toLowerCase() as Lowercase<string>
              }
              value={column}
            />
          ))}
        </ListBox>
      </div>
    </div>
  );
});
