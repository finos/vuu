import cx from "clsx";
import { ComboBox, ComboBoxProps } from "@salt-ds/core";
import {
  ChangeEvent,
  ForwardedRef,
  ReactElement,
  Ref,
  SyntheticEvent,
  forwardRef,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import expandoComboboxCss from "./ExpandoCombobox.css";

const classBase = "vuuExpandoCombobox";

export interface ExpandoComboboxProps<Item = string>
  extends ComboBoxProps<Item> {
  itemToString?: (item: Item) => string;
  dropdownOnAutofocus?: boolean;
}

export type ComboBoxOpenChangeHandler = Exclude<
  ComboBoxProps["onOpenChange"],
  undefined
>;

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
  const [value, setValue] = useState(
    valueProp === undefined ? "" : valueProp.toString(),
  );

  const handleChange = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) => {
      const value = evt.target.value;
      onChange?.(evt);
      setValue(value);
    },
    [onChange],
  );

  const handleSelectionChange = useCallback(
    (evt: SyntheticEvent, newSelected: Item[]) => {
      if (multiselect) {
        onSelectionChange?.(evt, newSelected);
      } else {
        const [selectedValue] = newSelected;
        setTimeout(() => {
          onSelectionChange?.(evt, newSelected);
          setValue(itemToString(selectedValue));
        }, 100);
      }
    },
    [onSelectionChange, itemToString, multiselect],
  );

  const handleOpenChange = useCallback<ComboBoxOpenChangeHandler>(
    (open, reason) => {
      onOpenChange?.(open, reason);
      setOpen(open);
    },
    [onOpenChange],
  );

  const inputProps = useMemo<ComboBoxProps<Item>["inputProps"]>(() => {
    return {
      autoComplete: "off",
      ...inputPropsProp,
      onFocus: (evt) => {
        inputPropsProp?.onFocus?.(evt);
        if (!dropdownOnAutofocus) return;

        setTimeout(() => {
          setOpen(true);
        }, 100);
      },
    };
  }, [inputPropsProp, dropdownOnAutofocus]);

  return (
    <div
      className={cx(classBase, className)}
      data-text={value}
      ref={forwardedRef}
    >
      <ComboBox<Item>
        {...props}
        inputProps={inputProps}
        multiselect={multiselect}
        onChange={handleChange}
        onOpenChange={handleOpenChange}
        onSelectionChange={handleSelectionChange}
        open={open}
        value={value}
      >
        {children}
      </ComboBox>
    </div>
  );
}) as <Item = string>(
  props: ExpandoComboboxProps<Item> & { ref?: Ref<HTMLDivElement> },
) => ReactElement;
