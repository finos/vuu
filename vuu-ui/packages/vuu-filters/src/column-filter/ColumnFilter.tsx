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
import { ForwardedRef, forwardRef, ReactElement } from "react";
import { ColumnFilterHookProps, useColumnFilter } from "./useColumnFilter";
import { VuuTable } from "@vuu-ui/vuu-protocol-types";

const classBase = "vuuColumnFilter";

export interface ColumnFilterProps
  extends SegmentedButtonGroupProps,
    ColumnFilterHookProps {
  /**
   * Display operator picker.
   */
  showOperatorPicker?: boolean;
  /**
   * VuuTable is required if typeahead support is expected.
   */
  table?: VuuTable;
}

export const ColumnFilter = forwardRef(function ColumnFilter(
  {
    column,
    className,
    onCommit: onCommitProp,
    operator = "=",
    showOperatorPicker = false,
    table,
    value,
    onColumnFilterChange,
    ...buttonGroupProps
  }: ColumnFilterProps,
  forwardRef: ForwardedRef<HTMLDivElement>,
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-column-filter",
    css: columnFilterCss,
    window: targetWindow,
  });

  const {
    op,
    allowedOperators,
    inputProps,
    rangeInputProps,
    handleOperatorChange,
    onCommit,
    onCommitRange,
  } = useColumnFilter({
    onCommit: onCommitProp,
    operator,
    column,
    value,
    onColumnFilterChange,
  });

  return (
    <SegmentedButtonGroup
      {...buttonGroupProps}
      className={cx(classBase, className)}
      ref={forwardRef}
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
              {op}
            </Button>
          </MenuTrigger>
          <MenuPanel>
            {allowedOperators.map((allowedOp) => (
              <MenuItem
                key={`allowedOp`}
                onClick={() => handleOperatorChange(allowedOp)}
              >
                {allowedOp}
              </MenuItem>
            ))}
          </MenuPanel>
        </Menu>
      ) : null}
      {getDataItemEditControl({
        InputProps: { inputProps },
        commitOnBlur: false,
        commitWhenCleared: true,
        dataDescriptor: column,
        onCommit,
        table,
      })}
      {op === "between"
        ? getDataItemEditControl({
            className: `${classBase}-rangeHigh`,
            commitWhenCleared: true,
            InputProps: { inputProps: rangeInputProps },
            dataDescriptor: column,
            onCommit: onCommitRange,
            table,
          })
        : null}
    </SegmentedButtonGroup>
  );
}) as (
  props: ColumnFilterProps & {
    ref?: ForwardedRef<HTMLDivElement>;
  },
) => ReactElement<ColumnFilterProps>;
