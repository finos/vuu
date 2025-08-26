import {
  Button,
  Menu,
  MenuItem,
  MenuPanel,
  MenuTrigger,
  SegmentedButtonGroup,
  SegmentedButtonGroupProps,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";

import columnFilterCss from "./ColumnFilter.css";
import { getDataItemEditControl } from "@vuu-ui/vuu-data-react";
import { useCallback, useMemo } from "react";
import { CommitHandler } from "@vuu-ui/vuu-utils";
import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import {
  assertValidValue,
  ColumnFilterHookProps,
  FilterValue,
} from "./useColumnFilter";

const classBase = "vuuColumnFilter";

export interface ColumnFilterProps
  extends ColumnFilterHookProps,
    SegmentedButtonGroupProps {
  showOperatorPicker?: boolean;
  /**
   * VuuTable is required if typeahead support is expected.
   */
  table?: VuuTable;

  /**
   * Initial filter value. Pair of values expewcted when operator is
   * 'between'
   */
  value?: FilterValue | [FilterValue, FilterValue];
}

export const ColumnFilter = ({
  column,
  className,
  operator = "=",
  showOperatorPicker = false,
  table,
  value,
  ...buttonGroupProps
}: ColumnFilterProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-filter-bar",
    css: columnFilterCss,
    window: targetWindow,
  });

  useMemo(
    () => assertValidValue(column, operator, value),
    [column, operator, value],
  );

  const onCommit = useCallback<CommitHandler<HTMLElement>>((e, value) => {
    console.log(`onCommit ${value}`);
  }, []);

  return (
    <SegmentedButtonGroup
      {...buttonGroupProps}
      className={cx(classBase, className)}
    >
      {showOperatorPicker ? (
        <Menu placement="bottom-start">
          <MenuTrigger>
            <Button
              appearance="solid"
              aria-label="Open Menu"
              className={`${classBase}-trigger`}
              data-embedded
              sentiment="neutral"
            >
              {operator}
            </Button>
          </MenuTrigger>
          <MenuPanel>
            <MenuItem>=</MenuItem>
            <MenuItem>!=</MenuItem>
            <MenuItem>starts</MenuItem>
            <MenuItem>ends</MenuItem>
            <MenuItem>contains</MenuItem>
          </MenuPanel>
        </Menu>
      ) : null}
      {getDataItemEditControl({
        dataDescriptor: column,
        defaultValue: Array.isArray(value)
          ? (value[0] as string)
          : (value as string),
        onCommit,
        table,
      })}
      {operator === "between"
        ? getDataItemEditControl({
            className: `${classBase}-rangeHigh`,
            dataDescriptor: column,
            defaultValue: Array.isArray(value)
              ? (value[1] as string)
              : undefined,
            onCommit,
            table,
          })
        : null}
    </SegmentedButtonGroup>
  );
};
