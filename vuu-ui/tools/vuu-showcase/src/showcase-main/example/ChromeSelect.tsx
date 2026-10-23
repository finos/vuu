import { Dropdown, Option } from "@salt-ds/core";
import cx from "clsx";
import type { ReactNode, SyntheticEvent } from "react";

import "./ChromeSelect.css";

export interface ChromeSelectOption<T extends string = string> {
  description?: ReactNode;
  icon?: ReactNode;
  label: string;
  /** e.g a status indicator, rendered after the label */
  adornment?: ReactNode;
  value: T;
}

export interface ChromeSelectProps<T extends string = string> {
  "aria-label": string;
  className?: string;
  icon?: ReactNode;
  onChange: (value: T) => void;
  onOpenChange?: (open: boolean) => void;
  options: ChromeSelectOption<T>[];
  value: T;
}

const classBase = "ShowcaseSelect";

/** A Salt Dropdown whose options can carry an icon, description and adornment */
export const ChromeSelect = <T extends string = string>({
  "aria-label": ariaLabel,
  className,
  icon,
  onChange,
  onOpenChange,
  options,
  value,
}: ChromeSelectProps<T>) => {
  const selected = options.find((option) => option.value === value);

  const handleSelectionChange = (_: SyntheticEvent, [newValue]: T[]) => {
    if (newValue !== undefined) {
      onChange(newValue);
    }
  };

  return (
    <Dropdown<T>
      aria-label={ariaLabel}
      className={cx(classBase, className)}
      onOpenChange={onOpenChange}
      onSelectionChange={handleSelectionChange}
      selected={selected ? [selected.value] : []}
      startAdornment={
        (icon ?? selected?.icon ?? selected?.adornment) ? (
          <span className={`${classBase}-adornments`}>
            {icon ?? selected?.icon}
            {selected?.adornment}
          </span>
        ) : undefined
      }
      value={selected?.label ?? ""}
    >
      {options.map((option) => (
        <Option
          className={`${classBase}-option`}
          key={option.value}
          value={option.value}
        >
          {option.icon ? (
            <span className={`${classBase}-optionIcon`}>{option.icon}</span>
          ) : null}
          <span className={`${classBase}-optionText`}>
            <span className={`${classBase}-optionLabel`}>{option.label}</span>
            {option.description ? (
              <span className={`${classBase}-optionDescription`}>
                {option.description}
              </span>
            ) : null}
          </span>
          {option.adornment}
        </Option>
      ))}
    </Dropdown>
  );
};
