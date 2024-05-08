import cx from "clsx";
import { ComboBox, ComboBoxProps } from "@salt-ds/core";
import {
  ChangeEvent,
  ForwardedRef,
  SyntheticEvent,
  forwardRef,
  useMemo,
  useState,
} from "react";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import expandoComboboxCss from "./ExpandoComboboxSalt.css";

const classBase = "vuuExpandoComboboxSalt";

export const ExpandoComboboxSalt = forwardRef(function ExpandoComboboxSalt<
  Item = string
>(
  {
    children,
    className,
    inputProps: inputPropsProp,
    multiselect,
    onChange,
    onSelectionChange,
    value: valueProp,
    ...props
  }: ComboBoxProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-expando-combobox",
    css: expandoComboboxCss,
    window: targetWindow,
  });

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(
    valueProp === undefined ? "" : valueProp.toString()
  );

  const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
    const value = evt.target.value;
    onChange?.(evt);
    setValue(value);
  };

  const handleSelectionChange = (
    evt: SyntheticEvent,
    newSelected: string[]
  ) => {
    if (multiselect) {
      onSelectionChange?.(evt, newSelected);
    } else {
      const [selectedValue] = newSelected;
      onSelectionChange?.(evt, newSelected);
      setValue(selectedValue ?? "");
    }
  };

  const inputProps = useMemo<ComboBoxProps<Item>["inputProps"]>(() => {
    return {
      autoComplete: "off",
      ...inputPropsProp,
      onFocus: (evt) => {
        inputPropsProp?.onFocus?.(evt);
        setTimeout(() => {
          setOpen(true);
        }, 100);
      },
    };
  }, [inputPropsProp]);

  // const matchingValues = values.filter((val) =>
  //   val.toLowerCase().startsWith(value.trim().toLowerCase())
  // );

  return (
    <div
      className={cx(classBase, className)}
      data-text={value}
      ref={forwardedRef}
    >
      <ComboBox
        {...props}
        inputProps={inputProps}
        multiselect={multiselect}
        onChange={handleChange}
        onOpenChange={setOpen}
        onSelectionChange={handleSelectionChange}
        open={open}
        value={value}
      >
        {children}
      </ComboBox>
    </div>
  );
});
