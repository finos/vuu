import { FormField, FormFieldLabel, Input, InputProps } from "@salt-ds/core";
import cx from "clsx";
import { HTMLAttributes, useMemo } from "react";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import filterNameFormCss from "./FilterNameForm.css";

const classBase = "vuuFilterNameForm";

export interface FilterNameFormProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  filterName?: string;
  onFilterNameChange: (filterName: string) => void;
}

export const FilterNameForm = ({
  className,
  filterName = "",
  onFilterNameChange,
  ...htmlAttributes
}: FilterNameFormProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-filter-name-form",
    css: filterNameFormCss,
    window: targetWindow,
  });

  const inputProps = useMemo<InputProps["inputProps"]>(
    () => ({
      onChange: (e) => {
        const { value } = e.target;
        console.log(`filterName ${value}`);
        onFilterNameChange(value);
      },
    }),
    [onFilterNameChange],
  );

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      <FormField>
        <FormFieldLabel>Filter name</FormFieldLabel>
        <Input defaultValue={filterName} inputProps={inputProps} />
      </FormField>
    </div>
  );
};
