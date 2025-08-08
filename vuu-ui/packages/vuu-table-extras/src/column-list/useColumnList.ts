import {
  ColumnDescriptor,
  ColumnListPermissions,
} from "@vuu-ui/vuu-table-types";
import {
  FormEventHandler,
  SyntheticEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { classBase, classBaseListItem, ColumnListProps } from "./ColumnList";
import { queryClosest } from "@vuu-ui/vuu-utils";

export interface ColumnSearchProps
  extends Pick<ColumnListProps, "columnItems" | "onChange"> {
  permissions: ColumnListPermissions;
}

export type ColumnItem = Pick<
  ColumnDescriptor,
  "hidden" | "label" | "name" | "serverDataType"
> & {
  isCalculated: boolean;
  subscribed: boolean;
};

export const useColumnList = ({
  columnItems,
  onChange,
  permissions: { allowHideColumns, allowRemoveColumns },
}: ColumnSearchProps) => {
  const [searchState, setSearchState] = useState<{
    searchText: string;
  }>({ searchText: "" });

  const visibleColumnsRef = useRef<ColumnItem[] | undefined>(undefined);

  const hideOnly = useMemo(
    () => allowHideColumns && !allowRemoveColumns,
    [allowHideColumns, allowRemoveColumns],
  );

  useMemo(() => {
    if (searchState.searchText) {
      visibleColumnsRef.current = columnItems.filter(
        (item) => item.name.indexOf(searchState.searchText) !== -1,
      );
    }
  }, [columnItems, searchState.searchText]);

  const handleChangeSearchInput = useCallback<FormEventHandler>(
    (evt) => {
      const { value } = evt.target as HTMLInputElement;
      if (value) {
        visibleColumnsRef.current = columnItems.filter(
          (item) => item.name.indexOf(value) !== -1,
        );
      } else {
        visibleColumnsRef.current = undefined;
      }
      setSearchState({
        searchText: value,
      });
    },
    [columnItems],
  );

  const handleChangeListItem = useCallback(
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

  return {
    onChangeSearchInput: handleChangeSearchInput,
    onChangeListItem: handleChangeListItem,
    searchState,
    visibleColumnItems: visibleColumnsRef.current ?? columnItems,
  };
};
