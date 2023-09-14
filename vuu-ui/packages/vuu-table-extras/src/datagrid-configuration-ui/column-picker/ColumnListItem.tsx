import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { ListItem, ListItemType } from "@salt-ds/lab";
import cx from "classnames";

import "./ColumnListItem.css";

const classBase = "vuuColumnListItem";

export const ColumnListItem: ListItemType<ColumnDescriptor> = ({
  className: classNameProp,
  item,
  label,
  style: styleProp,
  ...restProps
}) => {
  const className = cx(classBase, classNameProp, {
    [`${classBase}-calculated`]: item?.expression,
    [`${classBase}-hidden`]: item?.hidden,
  });
  return (
    <ListItem className={className} {...restProps}>
      <span className={`${classBase}-iconType`} />
      <label className={`${classBase}-label`}>{label}</label>
      <span className={`${classBase}-iconHidden`} />
    </ListItem>
  );
};
