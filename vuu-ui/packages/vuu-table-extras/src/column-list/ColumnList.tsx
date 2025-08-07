import {
  Checkbox,
  Input,
  ListBox,
  Option,
  OptionProps,
  Switch,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  ColumnDescriptor,
  ColumnListPermissions,
} from "@vuu-ui/vuu-table-types";
import { Icon, IconButton } from "@vuu-ui/vuu-ui-controls";
import {
  DragDropProvider,
  getColumnLabel,
  queryClosest,
  reorderColumnItems,
  useSortable,
} from "@vuu-ui/vuu-utils";
import cx from "clsx";
import {
  HTMLAttributes,
  MouseEventHandler,
  RefCallback,
  SyntheticEvent,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { ColumnItem } from "../table-column-settings/useTableSettings";

import columnList from "./ColumnList.css";
import { useColumnList } from "../table-column-settings/useColumnList";

const classBase = "vuuColumnList";
const classBaseListItem = "vuuColumnListItem";

const searchIcon = <span data-icon="search" />;
const NO_SELECTION: string[] = [] as const;

const useSorting = (id: string, index: number, allowSort = true) => {
  const { handleRef: sortableHandleRef, ref: sortableRef } = useSortable({
    id,
    index,
  });

  const noopRef = useCallback(() => {
    // do nothing
  }, []);

  const [handleRef, ref] = useMemo(() => {
    return allowSort ? [sortableHandleRef, sortableRef] : [noopRef, noopRef];
  }, [allowSort, noopRef, sortableHandleRef, sortableRef]);

  return {
    handleRef,
    ref,
  };
};

export type ColumnChangeHandler = (
  columnName: string,
  propertyName: keyof ColumnDescriptor | "subscribed",
  value: string | number | boolean,
) => void;

export interface ColumnListProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  columnItems: ColumnItem[];
  onChange: ColumnChangeHandler;
  onNavigateToColumn?: (columnName: string) => void;
  onReorderColumnItems?: (columnItems: ColumnItem[]) => void;
  permissions?: ColumnListPermissions;
}

const defaultPermissions: ColumnListPermissions = {
  allowColumnSearch: false,
  allowHideColumns: true,
  allowRemoveColumns: true,
  allowReorderColumns: true,
};

const ColumnListItem = ({
  className: classNameProp,
  index,
  item,
  permissions: { allowHideColumns, allowRemoveColumns, allowReorderColumns },
  ...optionProps
}: OptionProps & {
  index: number;
  item: ColumnItem;
  permissions: ColumnListPermissions;
}) => {
  const hideOnly = allowHideColumns && !allowRemoveColumns;
  const removeOnly = !allowHideColumns && allowRemoveColumns;
  const hideAndRemove = allowHideColumns && allowRemoveColumns;

  const { handleRef, ref } = useSorting(item.name, index, allowReorderColumns);
  return (
    <Option
      {...optionProps}
      className={cx(classNameProp, classBaseListItem)}
      data-name={item.name}
      id={item.name}
      ref={ref}
    >
      {allowReorderColumns ? (
        <IconButton
          data-embedded
          appearance="transparent"
          icon="draggable"
          ref={handleRef}
          size={16}
        />
      ) : null}
      {item?.isCalculated ? <Icon name="function" /> : null}
      {hideAndRemove || hideOnly || removeOnly ? (
        <Checkbox
          className={`${classBase}-checkBox`}
          checked={hideOnly ? item?.hidden !== true : item?.subscribed}
        />
      ) : null}
      <span className={`${classBase}-text`}>
        {getColumnLabel(item as ColumnDescriptor)}
      </span>
      {hideAndRemove ? (
        <Switch
          className={`${classBase}-switch`}
          checked={item?.hidden !== true}
          disabled={item?.subscribed !== true}
        />
      ) : null}
    </Option>
  );
};

export const ColumnList = ({
  className,
  columnItems,
  onChange,
  onNavigateToColumn,
  onReorderColumnItems,
  permissions: {
    allowColumnSearch = defaultPermissions.allowColumnSearch,
    allowHideColumns = defaultPermissions.allowHideColumns,
    allowRemoveColumns = defaultPermissions.allowRemoveColumns,
    allowReorderColumns = defaultPermissions.allowReorderColumns,
  } = defaultPermissions,
  ...htmlAttributes
}: ColumnListProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-column-list",
    css: columnList,
    window: targetWindow,
  });
  const listRef = useRef<HTMLDivElement>(null);
  const [permissions, hideOnly] = useMemo(
    () => [
      {
        allowHideColumns,
        allowRemoveColumns,
        allowReorderColumns,
      },
      allowHideColumns && !allowRemoveColumns,
    ],
    [allowHideColumns, allowRemoveColumns, allowReorderColumns],
  );

  const {
    onChange: onSearchInputChange,
    searchState,
    visibleColumnItems,
  } = useColumnList({ columnItems });

  const handleChange = useCallback(
    ({ target }: SyntheticEvent) => {
      const input = target as HTMLInputElement;
      const listItem = queryClosest(target, `.${classBaseListItem}`);
      if (listItem) {
        const {
          dataset: { name },
        } = listItem;
        if (name) {
          const saltCheckbox = queryClosest(target, `.${classBase}-checkBox`);
          const saltSwitch = queryClosest(target, `.${classBase}-switch`);

          if (saltCheckbox && !hideOnly) {
            onChange(name, "subscribed", input.checked);
          } else if (saltSwitch || hideOnly) {
            onChange(name, "hidden", input.checked === false);
          }
        }
      }
    },
    [hideOnly, onChange],
  );

  const handleClick = useCallback<MouseEventHandler>(
    (evt) => {
      const targetEl = evt.target as HTMLElement;
      if (targetEl.classList.contains("vuuColumnList-text")) {
        const listItemEl = targetEl.closest(".vuuListItem") as HTMLElement;
        if (listItemEl?.dataset.name) {
          onNavigateToColumn?.(listItemEl.dataset.name);
        }
      }
    },
    [onNavigateToColumn],
  );

  const handleDragEnd = useCallback(() => {
    setTimeout(() => {
      const listItems =
        listRef.current?.querySelectorAll<HTMLDivElement>(".saltOption");
      if (listItems) {
        const orderedIds = Array.from(listItems).map(({ id }) => id);
        onReorderColumnItems?.(reorderColumnItems(columnItems, orderedIds));
      }
    }, 300);
  }, [columnItems, onReorderColumnItems]);

  const searchCallbackRef = useCallback<RefCallback<HTMLElement>>((el) => {
    setTimeout(() => {
      el?.querySelector("input")?.focus();
    }, 100);
  }, []);

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <div
        {...htmlAttributes}
        className={cx(classBase, className, {
          [`${classBase}-withColumnNavigation`]:
            typeof onNavigateToColumn === "function",
        })}
      >
        {allowColumnSearch ? (
          <form className={`${classBase}-search`} role="search">
            <Input
              // inputProps={{ onKeyDown }}
              startAdornment={searchIcon}
              placeholder="Find column"
              ref={searchCallbackRef}
              value={searchState.searchText}
              onChange={onSearchInputChange}
            />
          </form>
        ) : null}
        <div className={`${classBase}-header`}>
          <span>Column Name</span>
        </div>
        {allowHideColumns && allowRemoveColumns ? (
          <div className={`${classBase}-colHeadings`}>
            <span>Column subscription</span>
            <span>Visibility</span>
          </div>
        ) : null}
        <ListBox ref={listRef} selected={NO_SELECTION}>
          {visibleColumnItems.map((columnItem, index) => (
            <ColumnListItem
              item={columnItem}
              index={index}
              key={columnItem.name}
              onChange={handleChange}
              onClick={handleClick}
              permissions={permissions}
              value={columnItem}
            />
          ))}
        </ListBox>
      </div>
    </DragDropProvider>
  );
};
