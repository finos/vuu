import { Button, ButtonProps } from "@salt-ds/core";
import cx from "classnames";
import { CommitResponse } from "packages/vuu-datagrid-types";
import {
  VuuColumnDataType,
  VuuRowDataItemType,
} from "packages/vuu-protocol-types";
import { ForwardedRef, forwardRef, SyntheticEvent, useCallback } from "react";

const classBase = "vuuCycleStateButton";

export interface CycleStateButtonProps extends ButtonProps {
  onCommit: (evt: SyntheticEvent, value: VuuRowDataItemType) => CommitResponse;
  values: string[];
  value: string;
}

const getNextValue = (value: string, valueList: string[]) => {
  const index = valueList.indexOf(value);
  if (index === valueList.length - 1) {
    return valueList[0];
  } else {
    return valueList[index + 1];
  }
};

export const CycleStateButton = forwardRef(function CycleStateButton(
  { className, onCommit, value, values, ...buttonProps }: CycleStateButtonProps,
  forwardedRef: ForwardedRef<HTMLButtonElement>
) {
  const handleClick = useCallback(
    (evt: SyntheticEvent<HTMLButtonElement>) => {
      const nextValue = getNextValue(value, values);
      onCommit(evt, nextValue as VuuColumnDataType).then((response) => {
        if (response !== true) {
          console.error(response);
        }
      });
    },
    [onCommit, value, values]
  );

  return (
    <Button
      {...buttonProps}
      className={cx(
        classBase,
        className,
        `${classBase}-${value.toLowerCase()}`
      )}
      onClick={handleClick}
      ref={forwardedRef}
    >
      {value}
    </Button>
  );
});
