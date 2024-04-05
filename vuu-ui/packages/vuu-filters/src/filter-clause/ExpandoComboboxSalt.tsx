import cx from "clsx";
import { ComboBox, ComboBoxProps, Option } from "@salt-ds/core";
import {
  ChangeEvent,
  ForwardedRef,
  SyntheticEvent,
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import "./ExpandoComboboxSalt.css";

const classBase = "vuuExpandoComboboxSalt";

export type ExpandoComboboxSaltProps = Omit<
  ComboBoxProps,
  "children" | "defaultValue" | "value"
> &
  Required<Pick<ComboBoxProps, "onSelectionChange" | "value">> & {
    values: string[];
  };

export const ExpandoComboboxSalt = forwardRef(function ExpandoComboboxSalt<
  Item = string
>(
  {
    className,
    inputProps: inputPropsProp,
    multiselect,
    onChange,
    onSelectionChange,
    value: valueProp,
    values,
    ...props
  }: ExpandoComboboxSaltProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(valueProp.toString());

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
      onSelectionChange(evt, newSelected);
    } else {
      const [selectedValue] = newSelected;
      onSelectionChange(evt, newSelected);
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

  const matchingValues = values.filter((val) =>
    val.toLowerCase().startsWith(value.trim().toLowerCase())
  );

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
        {matchingValues.map((value) => (
          <Option className="vuuExpandoOption" key={value} value={value} />
        ))}
      </ComboBox>
    </div>
  );
});
