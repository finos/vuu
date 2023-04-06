import { memo } from "react";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { Highlighter, ListItem, ListItemProps, ListItemType } from "@heswell/salt-lab";

export const ColumnListItem: ListItemType<ColumnDescriptor> = (props) => {
  return <MemoColumnItem {...props} />;
};

const MemoColumnItem = memo(function MemoizedItem({
  item,
  itemTextHighlightPattern,
  ...restProps
}: ListItemProps<ColumnDescriptor>) {
  return (
    <ListItem {...restProps}>
      <span style={{ marginLeft: 10 }}>
        <Highlighter
          matchPattern={itemTextHighlightPattern}
          text={item?.name}
        />
      </span>
    </ListItem>
  );
});
