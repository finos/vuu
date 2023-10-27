import {
  List,
  ListItem,
  ListItemProps,
  ListProps,
} from "@finos/vuu-ui-controls";
import { Checkbox } from "@salt-ds/core";
import { Switch } from "@salt-ds/lab";
import cx from "classnames";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import {
  HTMLAttributes,
  MouseEventHandler,
  SyntheticEvent,
  useCallback,
} from "react";
import { ColumnItem } from "../table-settings";

import "./ColumnList.css";
import { getColumnLabel } from "@finos/vuu-utils";

const classBase = "vuuColumnList";
const classBaseListItem = "vuuColumnListItem";

export type ColumnChangeHandler = (
  columnName: string,
  propertyName: keyof ColumnDescriptor | "subscribed",
  value: string | number | boolean
) => void;

export interface ColumnListProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  columnItems: ColumnItem[];
  onChange: ColumnChangeHandler;
  onMoveListItem: ListProps["onMoveListItem"];
  onNavigateToColumn?: (columnName: string) => void;
}

const ColumnListItem = ({
  className: classNameProp,
  item,
  ...listItemProps
}: ListItemProps<ColumnItem>) => {
  return (
    <ListItem
      {...listItemProps}
      className={cx(classNameProp, classBaseListItem)}
      data-name={item?.name}
    >
      <span className={`${classBase}-icon`} data-icon="draggable" />
      {item?.isCalculated ? (
        <span className={`${classBase}-icon`} data-icon="function" />
      ) : (
        <Switch className={`${classBase}-switch`} checked={item?.subscribed} />
      )}
      <span className={`${classBase}-text`}>
        {getColumnLabel(item as ColumnDescriptor)}
      </span>
      <Checkbox
        className={`${classBase}-checkBox`}
        checked={item?.hidden !== true}
        disabled={item?.subscribed !== true}
      />
    </ListItem>
  );
};

export const ColumnList = ({
  columnItems,
  onChange,
  onMoveListItem,
  onNavigateToColumn,
  ...htmlAttributes
}: ColumnListProps) => {
  const handleChange = useCallback(
    (evt: SyntheticEvent) => {
      const input = evt.target as HTMLInputElement;
      const listItem = input.closest(`.${classBaseListItem}`) as HTMLElement;
      const {
        dataset: { name },
      } = listItem;
      if (name) {
        const saltSwitch = input.closest(`.${classBase}-switch`) as HTMLElement;
        const saltCheckbox = input.closest(
          `.${classBase}-checkBox`
        ) as HTMLElement;

        if (saltSwitch) {
          onChange(name, "subscribed", input.checked);
        } else if (saltCheckbox) {
          onChange(name, "hidden", input.checked === false);
        }
      }
    },
    [onChange]
  );

  const handleClick = useCallback<MouseEventHandler>((evt) => {
    const targetEl = evt.target as HTMLElement;
    if (targetEl.classList.contains("vuuColumnList-text")) {
      const listItemEl = targetEl.closest(".vuuListItem") as HTMLElement;
      if (listItemEl?.dataset.name) {
        onNavigateToColumn?.(listItemEl.dataset.name);
      }
    }
  }, []);

  return (
    <div {...htmlAttributes} className={classBase}>
      <div className={`${classBase}-header`}>
        <span>Column Selection</span>
      </div>
      <div className={`${classBase}-colHeadings`}>
        <span>Column subscription</span>
        <span>Visibility</span>
      </div>
      <List<ColumnItem, "none">
        ListItem={ColumnListItem}
        allowDragDrop
        height="auto"
        onChange={handleChange}
        onClick={handleClick}
        onMoveListItem={onMoveListItem}
        selectionStrategy="none"
        source={columnItems}
        itemHeight={33}
      />
    </div>
  );
};
