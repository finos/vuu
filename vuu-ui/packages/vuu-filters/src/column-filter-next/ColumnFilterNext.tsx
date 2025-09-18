import {
  ChangeEventHandler,
  useCallback,
  useMemo,
  type HTMLAttributes,
} from "react";
import cx from "clsx";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  DataItemEditControlProps,
  getDataItemEditControl,
} from "@vuu-ui/vuu-data-react";
import { InputProps, useControlled } from "@salt-ds/core";
import {
  ColumnFilterChangeHandler,
  ColumnFilterOp,
  ColumnFilterValue,
} from "@vuu-ui/vuu-filter-types";
import { CommitHandler } from "@vuu-ui/vuu-utils";
import { ColumnFilterCommitHandler } from "../column-filter/useColumnFilter";

const classBase = "vuuFilterColumnNext";

const injectInputProps = (
  InputProps: InputProps | undefined,
  inputProps: InputProps["inputProps"],
): InputProps => {
  if (InputProps === undefined) {
    return {
      inputProps,
    };
  } else {
    return {
      ...InputProps,
      inputProps: {
        ...InputProps.inputProps,
        ...inputProps,
      },
    };
  }
};

export interface ColumnFilterNextProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange">,
    Pick<DataItemEditControlProps, "InputProps" | "TypeaheadProps" | "table"> {
  column: ColumnDescriptor;
  defaultValue?: ColumnFilterValue;
  onColumnFilterChange?: ColumnFilterChangeHandler;
  onCommit: ColumnFilterCommitHandler;
  operator?: ColumnFilterOp;
  value?: ColumnFilterValue;
}

export const ColumnFilterNext = ({
  InputProps: InputPropsProp,
  TypeaheadProps,
  className,
  column,
  defaultValue,
  onColumnFilterChange,
  onCommit: onCommitProp,
  operator = "=",
  table,
  value: valueProp,
  ...htmlAttributes
}: ColumnFilterNextProps) => {
  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: "ColumnFilterNext",
    state: "value",
  });

  const onChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      const { value = "" } = e.target;
      setValue(value);
      onColumnFilterChange?.(e.target.value, column, operator);
    },
    [column, onColumnFilterChange, operator, setValue],
  );

  const handleCommit = useCallback<CommitHandler<HTMLElement>>(
    (e, value = "") => {
      setValue(value as ColumnFilterValue);
      onCommitProp(column, operator, value as ColumnFilterValue);
    },
    [column, onCommitProp, operator, setValue],
  );

  const InputProps = useMemo(
    () => injectInputProps(InputPropsProp, { onChange, value }),
    [InputPropsProp, onChange, value],
  );

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      {getDataItemEditControl({
        InputProps,
        TypeaheadProps,
        commitWhenCleared: true,
        dataDescriptor: column,
        onCommit: handleCommit,
        table,
      })}
    </div>
  );
};
