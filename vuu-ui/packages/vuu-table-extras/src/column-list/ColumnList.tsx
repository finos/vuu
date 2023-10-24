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
import { HTMLAttributes, SyntheticEvent, useCallback } from "react";
import { ColumnItem } from "../table-settings";

import "./ColumnList.css";

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
      {item?.isCalculated ? (
        <span className={`${classBase}-icon`} data-icon="function" />
      ) : (
        <Switch className={`${classBase}-switch`} checked={item?.subscribed} />
      )}
      <span className={`${classBase}-text`}>{item?.label ?? item?.name}</span>
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
        height="100%"
        onChange={handleChange}
        onMoveListItem={onMoveListItem}
        selectionStrategy="none"
        source={columnItems}
        itemHeight={33}
      />
    </div>
  );
};
