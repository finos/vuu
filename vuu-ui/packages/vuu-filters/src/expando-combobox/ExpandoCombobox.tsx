import cx from "clsx";
import { ComboBox, type ComboBoxProps, useForkRef } from "@salt-ds/core";
import {
  type ChangeEvent,
  type ForwardedRef,
  type ReactElement,
  type Ref,
  type SyntheticEvent,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import expandoComboboxCss from "./ExpandoCombobox.css";

const classBase = "vuuExpandoCombobox";

export interface ExpandoComboboxProps<Item = string>
  extends Omit<ComboBoxProps<Item>, "onOpenChange"> {
  itemToString?: (item: Item) => string;
  dropdownOnAutofocus?: boolean;
  onOpenChange?: (open: boolean, reason?: "manual" | "input" | "focus") => void;
}

const defaultItemToString = (item: unknown) => {
  if (typeof item === "string") {
    return item;
  } else {
    return item?.toString() ?? "";
  }
};
export const ExpandoCombobox = forwardRef(function ExpandoCombobox<
  Item = string,
>(
  {
    children,
    className,
    inputProps: inputPropsProp,
    itemToString = defaultItemToString,
    multiselect,
    onChange,
    onSelectionChange,
    onOpenChange,
    value: valueProp,
    dropdownOnAutofocus = true,
    ...props
  }: ExpandoComboboxProps<Item>,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-expando-combobox",
    css: expandoComboboxCss,
    window: targetWindow,
  });

  const [open, setOpen] = useState(false);
  // the current value is marked in the list until the user types
  const [selected, setSelected] = useState<Item[]>(() =>
    multiselect || valueProp === undefined || valueProp === ""
      ? []
      : [valueProp as Item],
  );
  const [value, setValue] = useState(
    valueProp === undefined ? "" : valueProp.toString(),
  );

  const handleChange = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) => {
      const value = evt.target.value;
      onChange?.(evt);
      setValue(value);
      setSelected([]);
    },
    [onChange],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const ref = useForkRef(forwardedRef, containerRef);
  const openOnFocusTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => () => clearTimeout(openOnFocusTimer.current), []);

  const inputHasFocus = useCallback(() => {
    const input = containerRef.current?.querySelector("input");
    return input != null && input === input.ownerDocument.activeElement;
  }, []);

  const handleSelectionChange = useCallback(
    (evt: SyntheticEvent, newSelected: Item[]) => {
      // selecting an option closes the list, it must not reopen on focus
      clearTimeout(openOnFocusTimer.current);
      if (multiselect) {
        onSelectionChange?.(evt, newSelected);
      } else {
        setSelected(newSelected);
        const [selectedValue] = newSelected;
        setTimeout(() => {
          onSelectionChange?.(evt, newSelected);
          setValue(itemToString(selectedValue));
        }, 100);
      }
    },
    [onSelectionChange, itemToString, multiselect],
  );

  const handleOpenChange = useCallback(
    (open: boolean, reason?: "manual" | "input") => {
      // The list is only shown while the input has focus. Once focus has
      // moved to another field, requests to open the list are ignored.
      if (open && !inputHasFocus()) {
        return;
      }
      onOpenChange?.(open, reason);
      setOpen(open);
    },
    [inputHasFocus, onOpenChange],
  );

  const inputProps = useMemo<ComboBoxProps<Item>["inputProps"]>(() => {
    return {
      autoComplete: "off",
      ...inputPropsProp,
      onBlur: (evt) => {
        inputPropsProp?.onBlur?.(evt);
        clearTimeout(openOnFocusTimer.current);
      },
      onFocus: (evt) => {
        inputPropsProp?.onFocus?.(evt);
        if (!dropdownOnAutofocus) return;

        clearTimeout(openOnFocusTimer.current);
        openOnFocusTimer.current = setTimeout(() => {
          // focus may have moved on to another field
          if (inputHasFocus()) {
            setOpen(true);
            onOpenChange?.(true, "focus");
          }
        }, 100);
      },
    };
  }, [inputPropsProp, dropdownOnAutofocus, inputHasFocus, onOpenChange]);

  const [currentItem] = selected;
  const hint =
    !multiselect && currentItem !== undefined && open
      ? `Tab keeps ${itemToString(currentItem)} · type to filter`
      : undefined;

  return (
    <div className={cx(classBase, className)} data-text={value} ref={ref}>
      <ComboBox<Item>
        {...props}
        OverlayProps={{
          ...props.OverlayProps,
          className: cx(`${classBase}-overlay`, props.OverlayProps?.className),
          ...(hint ? { "data-hint": hint } : undefined),
        }}
        inputProps={inputProps}
        multiselect={multiselect}
        onChange={handleChange}
        onOpenChange={handleOpenChange}
        onSelectionChange={handleSelectionChange}
        open={open}
        selected={selected}
        value={value}
      >
        {children}
      </ComboBox>
    </div>
  );
}) as <Item = string>(
  props: ExpandoComboboxProps<Item> & { ref?: Ref<HTMLDivElement> },
) => ReactElement;
