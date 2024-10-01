import {
  flip,
  size,
  useClick,
  useDismiss,
  useInteractions,
} from "@floating-ui/react";
import { useFloatingUI } from "@salt-ds/core";
import {
  ChangeEvent,
  KeyboardEventHandler,
  RefCallback,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import type { DataSourceRowObject } from "@finos/vuu-data-types";
import type {
  TableConfig,
  TableRowSelectHandler,
} from "@finos/vuu-table-types";
import { useDataSource } from "@finos/vuu-utils";
import type { TablePickerProps } from "./TablePicker";
import {
  isNavigationKey,
  isRowSelectionKey,
  useControlledTableNavigation,
} from "@finos/vuu-table";

export interface TablePickerHookProps
  extends Pick<
    TablePickerProps,
    "TableProps" | "onSelect" | "rowToString" | "schema"
  > {
  defaultIsOpen?: boolean;
  isOpen?: boolean;
}

const defaultRowToString = (row: DataSourceRowObject) =>
  Object.values(row.data).join(" ");

export const useTablePicker = ({
  TableProps,
  rowToString = defaultRowToString,
  schema,
  onSelect,
}: TablePickerHookProps) => {
  const { VuuDataSource } = useDataSource();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  const widthRef = useRef(-1);

  const tableColumns = TableProps?.config.columns;

  const containerRef = useCallback<RefCallback<HTMLDivElement>>((el) => {
    widthRef.current = el?.clientWidth ?? -1;
  }, []);

  const dataSource = useMemo(() => {
    const columns = tableColumns ?? schema.columns;

    return new VuuDataSource({
      columns: columns.map((c) => c.name),
      table: schema.table,
    });
  }, [tableColumns, VuuDataSource, schema]);

  const navigation = useControlledTableNavigation(-1, dataSource.size);

  // const baseFilterPattern = useMemo(
  //   // TODO make this contains once server supports it
  //   () => searchColumns.map((col) => `${col} starts "__VALUE__"`).join(" or "),
  //   [searchColumns],
  // );

  // const handleOpenChange = useCallback<OpenChangeHandler>(
  //   (open, closeReason) => {
  //     setIsOpen(open);
  //     onOpenChange?.(open, closeReason);
  //   },
  //   [onOpenChange, setIsOpen],
  // );

  const { context, elements, ...floatingUIProps } = useFloatingUI({
    open,
    onOpenChange: setOpen,
    placement: "bottom-end",
    strategy: "fixed",
    middleware: [
      size({
        apply({ rects, elements, availableHeight }) {
          Object.assign(elements.floating.style, {
            minWidth: `${rects.reference.width}px`,
            maxHeight: `max(calc(${availableHeight}px - var(--salt-spacing-100)), calc((var(--salt-size-base) + var(--salt-spacing-100)) * 5))`,
          });
        },
      }),
      flip({ fallbackStrategy: "initialPlacement" }),
    ],
  });

  const interactionPropGetters = useInteractions([
    useDismiss(context),
    useClick(context, { keyboardHandlers: false, toggle: false }),
  ]);

  const handleInputChange = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) => {
      const { value } = evt.target;
      setValue(value);

      // if (value && value.trim().length) {
      //   const filter = baseFilterPattern.replaceAll("__VALUE__", value);
      //   dataSource.filter = {
      //     filter,
      //   };
      // } else {
      //   dataSource.filter = {
      //     filter: "",
      //   };
      // }
    },
    [],
  );

  const handleSelectRow = useCallback<TableRowSelectHandler>(
    (row) => {
      const value = row === null ? "" : rowToString(row);
      setValue(value);
      onSelect?.(row);
      // TODO do we need to include a reason ?
      requestAnimationFrame(() => {
        setOpen(false);
      });
    },
    [onSelect, rowToString],
  );

  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLElement>>(
    (evt) => {
      if (open) {
        if (isNavigationKey(evt.key, "row") || isRowSelectionKey(evt.key)) {
          navigation.onKeyDown(evt);
        }
      } else {
        if (evt.key === "ArrowDown" || evt.key === "Enter") {
          setOpen(true);
        }
      }
    },
    [navigation, open],
  );

  const inputProps = {
    inputProps: {
      autoComplete: "off",
      onKeyDown: handleKeyDown,
    },
    onChange: handleInputChange,
  };
  const tableHandlers = {
    onSelect: handleSelectRow,
  };

  const tableConfig = useMemo<TableConfig>(() => {
    const config = TableProps?.config;
    if (config) {
      const {
        columns = schema.columns,
        columnLayout = "fit",
        ...rest
      } = config;
      return {
        columns,
        columnLayout,
        ...rest,
      };
    } else {
      return {
        columnLayout: "fit",
        columns: schema.columns,
      };
    }
  }, [TableProps, schema]);

  return {
    containerRef,
    dataSource,
    highlightedIndex: navigation.highlightedIndexRef.current,
    floatingUIProps,
    inputProps,
    interactionPropGetters,
    onKeyDown: handleKeyDown,
    open,
    tableConfig,
    tableHandlers,
    tableRef: navigation.tableRef,
    value,
    width: widthRef.current,
  };
};
