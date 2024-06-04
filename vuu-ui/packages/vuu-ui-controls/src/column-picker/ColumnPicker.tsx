import { flip, size } from "@floating-ui/react";
import {
  FloatingComponentProps,
  useFloatingComponent,
  useFloatingUI,
  useForkRef,
  useIdMemo,
} from "@salt-ds/core";
import cx from "clsx";
import { forwardRef, useState } from "react";
import { IconButton, IconButtonProps } from "../icon-button";
import { ColumnSearch, ColumnSearchProps } from "./ColumnSearch";

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
        className
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
}

export const ColumnPicker = forwardRef<HTMLButtonElement, ColumnPickerProps>(
  function ColumnPicker(
    { columns, icon = "add", onSelectionChange, selected, ...htmlAttributes },
    forwardedRef
  ) {
    const listId = useIdMemo();
    const { x, y, strategy, elements, floating, reference } = useFloatingUI({
      //   open: openState && columnItems != undefined,
      open: columns != undefined,
      //   onOpenChange: handleOpenChange,
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

    const [open, setOpen] = useState(false);
    const handleButtonClick = () => {
      setOpen((isOpen) => !isOpen);
    };

    const forkedRef = useForkRef<HTMLButtonElement>(reference, forwardedRef);

    const handleChange = () => {
      console.log("handleChange");
    };
    const handleMoveListItem = () => {
      console.log("handleMoveListItem");
    };

    return (
      <>
        <IconButton
          {...htmlAttributes}
          icon={icon}
          onClick={handleButtonClick}
          ref={forkedRef}
        />
        <FloatingColumnSearch
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
            onMoveListItem={handleMoveListItem}
            onSelectionChange={onSelectionChange}
            selected={selected}
            style={{ width: 220, height: 300 }}
          />
        </FloatingColumnSearch>
      </>
    );
  }
);
