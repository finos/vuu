import { Button, ButtonProps } from "@salt-ds/core";
import cx from "clsx";
import type {
  VuuColumnDataType,
  VuuRowDataItemType,
} from "@vuu-ui/vuu-protocol-types";
import { ForwardedRef, forwardRef, SyntheticEvent, useCallback } from "react";
import type { CommitHandler } from "@vuu-ui/vuu-utils";

const classBase = "vuuCycleStateButton";

export type CycleStateButtonChangeHandler = (value: VuuRowDataItemType) => void;

export interface CycleStateButtonProps extends Omit<ButtonProps, "onChange"> {
  onChange?: CycleStateButtonChangeHandler;
  onCommit?: CommitHandler<HTMLButtonElement>;
  values: string[];
  value: string;
}

const getNextValue = (value: string, valueList: string[]) => {
  const index = valueList
    .map((v) => v.toUpperCase())
    .indexOf(value.toUpperCase());
  if (index === valueList.length - 1) {
    return valueList[0];
  } else {
    return valueList[index + 1];
  }
};

export const CycleStateButton = forwardRef(function CycleStateButton(
  {
    className,
    onChange,
    onCommit,
    value = "",
    values,
    ...buttonProps
  }: CycleStateButtonProps,
  forwardedRef: ForwardedRef<HTMLButtonElement>,
) {
  const handleClick = useCallback(
    async (evt: SyntheticEvent<HTMLButtonElement>) => {
      const nextValue = getNextValue(value, values);
      onChange?.(nextValue);
      onCommit?.(evt, nextValue as VuuColumnDataType);
    },
    [onChange, onCommit, value, values],
  );

  return (
    <Button
      {...buttonProps}
      className={cx(
        classBase,
        className,
        `${classBase}-${value.toLowerCase()}`,
      )}
      onClick={handleClick}
      ref={forwardedRef}
    >
      {value}
    </Button>
  );
});
