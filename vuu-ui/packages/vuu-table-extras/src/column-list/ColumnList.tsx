import { ColumnDescriptor } from "@finos/vuu-table-types";
import {
  Icon,
  List,
  ListItem,
  ListItemProps,
  ListProps,
} from "@finos/vuu-ui-controls";
import { Checkbox, Switch } from "@salt-ds/core";
import cx from "clsx";
import {
  HTMLAttributes,
  MouseEventHandler,
  SyntheticEvent,
  useCallback,
} from "react";
import { ColumnItem } from "../table-settings";
import { getColumnLabel, queryClosest } from "@finos/vuu-utils";

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
      <Icon name="draggable" size={16} />
      {item?.isCalculated ? (
        <Icon name="function" />
      ) : (
        <Checkbox
          className={`${classBase}-checkBox`}
          checked={item?.subscribed}
        />
      )}
      <span className={`${classBase}-text`}>
        {getColumnLabel(item as ColumnDescriptor)}
      </span>
      <Switch
        className={`${classBase}-switch`}
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

          if (saltCheckbox) {
            onChange(name, "subscribed", input.checked);
          } else if (saltSwitch) {
            onChange(name, "hidden", input.checked === false);
          }
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
