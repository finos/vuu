import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { isValidNumber } from "@finos/vuu-utils";
import { Input, InputProps } from "@salt-ds/core";
import cx from "classnames";
import {
  FocusEventHandler,
  KeyboardEventHandler,
  SyntheticEvent,
  useCallback,
} from "react";

const classBase = "vuuInput";

export type Commithandler<T extends VuuRowDataItemType = VuuRowDataItemType> = (
  evt: SyntheticEvent<HTMLInputElement>,
  value: T
) => void;
export interface VuuInputProps<
  T extends VuuRowDataItemType = VuuRowDataItemType
> extends InputProps {
  onCommit: Commithandler<T>;
  type?: T;
}

/**
 * A variant of Salt Input that provides a commit callback prop,
 * TODO along with cancel behaviour ?
 */
export const VuuInput = <T extends VuuRowDataItemType = string>({
  className,
  onCommit,
  onKeyDown,
  type,
  ...props
}: VuuInputProps<T>) => {
  const commitValue = useCallback<Commithandler<string>>(
    (evt, value) => {
      if (type === "number") {
        const numericValue = parseFloat(value);
        if (isValidNumber(numericValue)) {
          onCommit(evt, numericValue as T);
        } else {
          //TODO add validation logic
          throw Error("Invalid value");
        }
      } else if (type === "boolean") {
        onCommit(evt, Boolean(value) as T);
      } else {
        onCommit(evt, value as T);
      }
    },
    [onCommit, type]
  );

  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLInputElement>>(
    (evt) => {
      if (evt.key === "Enter") {
        evt.preventDefault();
        evt.stopPropagation();
        const { value } = evt.target as HTMLInputElement;
        commitValue(evt, value);
      }
      onKeyDown?.(evt);
    },
    [commitValue, onKeyDown]
  );

  const handleBlur = useCallback<FocusEventHandler<HTMLInputElement>>(
    (evt) => {
      const { value } = evt.target as HTMLInputElement;
      commitValue(evt, value);
    },
    [commitValue]
  );

  return (
    <Input
      {...props}
      className={cx(classBase, className)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
};
