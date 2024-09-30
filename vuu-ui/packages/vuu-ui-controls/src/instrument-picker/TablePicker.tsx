import { TableSchema } from "@finos/vuu-data-types";
import { Table, TableProps } from "@finos/vuu-table";
import {
  flip,
  size,
  useClick,
  useDismiss,
  useInteractions,
} from "@floating-ui/react";
import {
  FloatingComponentProps,
  Input,
  useFloatingComponent,
  useFloatingUI,
  useIdMemo,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, forwardRef, useMemo, useState } from "react";
import { useTablePicker } from "./useTablePicker";

import { IconButton } from "../icon-button";
import tablePickerCss from "./TablePicker.css";
import { data } from "cypress/types/jquery";

const classBase = "vuuTablePicker";

interface FloatingTableProps extends FloatingComponentProps {
  collapsed?: boolean;
}

export interface TablePickerProps
  extends Omit<HTMLAttributes<HTMLElement>, "onSelect">,
    Pick<TableProps, "onSelect"> {
  schema: TableSchema;
}

const FloatingTable = forwardRef<HTMLDivElement, FloatingTableProps>(
  function FloatingTable(
    { children, className, collapsed, open, ...props },
    forwardedRef,
  ) {
    const { Component: FloatingComponent } = useFloatingComponent();
    return (
      <FloatingComponent
        className={cx(
          `${classBase}-floating-table`,
          {
            [`${classBase}-collapsed`]: collapsed,
          },
          className,
        )}
        role="listbox"
        open={open}
        {...props}
        ref={forwardedRef}
      >
        {children}
      </FloatingComponent>
    );
  },
);

export const TablePicker = ({
  onSelect,
  schema,
  ...htmlAttributes
}: TablePickerProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-table-picker",
    css: tablePickerCss,
    window: targetWindow,
  });

  const [open, setOpen] = useState(false);

  const tableId = useIdMemo();
  const { context, x, y, strategy, elements, floating, reference } =
    useFloatingUI({
      open,
      onOpenChange: setOpen,
      placement: "bottom-start",
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

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useDismiss(context),
    useClick(context, { keyboardHandlers: false, toggle: false }),
  ]);

  const {
    containerRef,
    dataSource,
    inputProps,
    isOpen,
    tableConfig,
    value,
    width,
  } = useTablePicker({
    onSelect,
    schema,
  });

  const endAdornment = useMemo(
    () => (
      <IconButton
        {...getReferenceProps()}
        ref={reference}
        icon="chevron-down"
      />
    ),
    [getReferenceProps, reference],
  );

  console.log({ dataSource, isOpen, elements });

  console.log({ width });

  return (
    <div {...htmlAttributes} className={classBase} ref={containerRef}>
      <Input {...inputProps} endAdornment={endAdornment} value={value} />
      <FloatingTable
        {...getFloatingProps()}
        collapsed={!open}
        id={tableId}
        open={open}
        left={x}
        position={strategy}
        ref={floating}
        top={y}
      >
        <Table
          config={tableConfig}
          dataSource={dataSource}
          height={300}
          width={width}
        />
      </FloatingTable>
    </div>
  );
};
