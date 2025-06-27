import {
  flip,
  size,
  useClick,
  useDismiss,
  useInteractions,
} from "@floating-ui/react";
import {
  FloatingComponentProps,
  useFloatingComponent,
  useFloatingUI,
  useForkRef,
  useIdMemo,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import cx from "clsx";
import { forwardRef, useState } from "react";
import { IconButton, IconButtonProps } from "../icon-button";
import { ColumnSearch, ColumnSearchProps } from "./ColumnSearch";

import columnPickerCss from "./ColumnPicker.css";

const classBase = "vuuColumnPicker";

interface FloatingColumnSearchProps extends FloatingComponentProps {
  collapsed?: boolean;
}

const FloatingColumnSearch = forwardRef<
  HTMLDivElement,
  FloatingColumnSearchProps
>(function FloatingColumnSearch(props, ref) {
  const { children, className, collapsed, open, ...rest } = props;

  const { Component: FloatingComponent } = useFloatingComponent();
  return (
    <FloatingComponent
      className={cx(
        classBase,
        {
          [`${classBase}-collapsed`]: collapsed,
        },
        className,
      )}
      role="listbox"
      open={open}
      {...rest}
      ref={ref}
    >
      {children}
    </FloatingComponent>
  );
});

export interface ColumnPickerProps
  extends Omit<IconButtonProps, "icon">,
    Pick<ColumnSearchProps, "columns" | "onSelectionChange" | "selected"> {
  icon?: string;
  iconSize?: number;
}

export const ColumnPicker = forwardRef<HTMLButtonElement, ColumnPickerProps>(
  function ColumnPicker(
    {
      columns,
      icon = "add",
      iconSize,
      onSelectionChange,
      selected,
      ...htmlAttributes
    },
    forwardedRef,
  ) {
    const targetWindow = useWindow();
    useComponentCssInjection({
      testId: "vuu-column-picker",
      css: columnPickerCss,
      window: targetWindow,
    });

    const [open, setOpen] = useState(false);

    const listId = useIdMemo();
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

    const handleButtonClick = () => {
      setOpen((isOpen) => !isOpen);
    };

    const forkedRef = useForkRef<HTMLButtonElement>(reference, forwardedRef);

    const handleChange = () => {
      console.log("handleChange");
    };
    const handleReorderColumns = () => {
      console.log("handleMoveListItem");
    };

    return (
      <>
        <IconButton
          {...htmlAttributes}
          {...getReferenceProps()}
          icon={icon}
          size={iconSize}
          onClick={handleButtonClick}
          ref={forkedRef}
          variant="secondary"
        />
        <FloatingColumnSearch
          {...getFloatingProps()}
          open={open}
          collapsed={!open}
          id={listId}
          left={x}
          position={strategy}
          ref={floating}
          top={y}
          width={elements.floating?.offsetWidth}
          height={elements.floating?.offsetHeight}
        >
          <ColumnSearch
            columns={columns}
            onChange={handleChange}
            onReorderColumns={handleReorderColumns}
            onSelectionChange={onSelectionChange}
            selected={selected}
            style={{ width: 220, height: 300 }}
          />
        </FloatingColumnSearch>
      </>
    );
  },
);
