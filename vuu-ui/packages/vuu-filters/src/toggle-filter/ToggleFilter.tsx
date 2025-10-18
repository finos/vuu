import {
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupProps,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { CommitHandler } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { ForwardedRef, forwardRef, SyntheticEvent, useCallback } from "react";
import { type ToggleFilterHookProps, useToggleFilter } from "./useToggleFilter";

type Value = ToggleButtonGroupProps["value"];

const getValues = (
  defaultValue: Value | undefined,
  value: Value | undefined,
) => {
  if (defaultValue === undefined && value === undefined) {
    return ["all"];
  } else if (defaultValue !== undefined && value !== undefined) {
    throw Error(
      "[ToggleFilter] only one of defaultValue/value must be provided",
    );
  } else if (defaultValue === "") {
    return ["all"];
  } else if (value === "") {
    return [undefined, "all"];
  } else {
    return [defaultValue, value];
  }
};

import toggleFilterCss from "./ToggleFilter.css";
/**
 * ToggleFilter is designed to work with a FilterProvider and
 * DataSourceProvider. With a DataSourceProvider, values will
 * be validated against available values from datasource.
 * With both FilterProvider and a DataSourceProvider, changes to
 * the currentFilter will also trigger re-evaluation of available
 * values from dataSource.
 * With neither of these Providers available, the ToggleFilter is
 * behaving like a regular ToggleButtonGroup.
 */
export interface ToggleFilterProps
  extends ToggleButtonGroupProps,
    ToggleFilterHookProps {
  onCommit: CommitHandler<HTMLElement>;
}

const classBase = "vuuToggleFilter";

export const ToggleFilter = forwardRef(function ToggleFilter(
  {
    className,
    column,
    defaultValue: defaultValueProp,
    onCommit,
    table,
    value: valueProp,
    values,
    ...ToggleButtonGroupProps
  }: ToggleFilterProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-toggle-filter",
    css: toggleFilterCss,
    window: targetWindow,
  });

  const [defaultValue, value] = getValues(defaultValueProp, valueProp);

  const onlyAvailableValue = useToggleFilter({ column, table, values });

  const handleChange = useCallback(
    (e: SyntheticEvent<HTMLButtonElement>) => {
      const value = e.currentTarget.value;
      if (value === "all") {
        onCommit(e, "");
      } else {
        onCommit(e, value);
      }
    },
    [onCommit],
  );

  return (
    <ToggleButtonGroup
      {...ToggleButtonGroupProps}
      className={cx(classBase, className)}
      defaultValue={defaultValue}
      onChange={handleChange}
      ref={forwardedRef}
      value={value}
    >
      <ToggleButton key="all" value="all">
        ALL
      </ToggleButton>
      {values.map((toggleValue) => (
        <ToggleButton
          className={cx({
            [`${classBase}-onlyAvailableValue`]:
              onlyAvailableValue === toggleValue,
          })}
          key={toggleValue}
          value={toggleValue}
        >
          {toggleValue}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
});
