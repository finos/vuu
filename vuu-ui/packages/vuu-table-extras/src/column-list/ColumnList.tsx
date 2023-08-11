import { List, ListItem, ListItemProps } from "@finos/vuu-ui-controls";
import { Checkbox } from "@salt-ds/core";
import { Switch } from "@salt-ds/lab";
import cx from "classnames";
import { ColumnDescriptor } from "packages/vuu-datagrid-types";
import { HTMLAttributes } from "react";

import "./ColumnList.css";

const classBase = "vuuColumnList";

export interface ColumnListProps extends HTMLAttributes<HTMLDivElement> {
  columns: ColumnDescriptor[];
}

const ColumnListItem = ({
  className: classNameProp,
  item,
  ...listItemProps
}: ListItemProps<ColumnDescriptor>) => {
  return (
    <ListItem
      {...listItemProps}
      className={cx(classNameProp, "vuuColumnListItem")}
    >
      <Switch className={`${classBase}-switch`} defaultChecked={false} />
      <span className={`${classBase}-text`}>{item?.label ?? item?.name}</span>
      <Checkbox className={`${classBase}-checkBox`} />
    </ListItem>
  );
};

export const ColumnList = ({ columns, ...htmlAttributes }: ColumnListProps) => {
  return (
    <div {...htmlAttributes} className={classBase}>
      <div className={`${classBase}-header`}>
        <span>Column Selection</span>
      </div>
      <div className={`${classBase}-colHeadings`}>
        <span>Column subscription</span>
        <span>Visibility</span>
      </div>
      <List
        ListItem={ColumnListItem}
        height="100%"
        selectionStrategy="none"
        source={columns}
        itemHeight={33}
      >
        {/* {columns.map((column) => (
          <ListItem
            className={`${classBase}Item`}
            key={column.label ?? column.name}
          >
            <Switch
              className={`${classBase}-switch`}
              label="xyz"
              checked={false}
            />
            <span>{column.label ?? column.name}</span>
            <Checkbox />
          </ListItem>
        ))} */}
      </List>
    </div>
  );
};
