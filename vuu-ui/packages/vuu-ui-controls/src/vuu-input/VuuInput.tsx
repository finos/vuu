import { Input, InputProps } from "@salt-ds/core";
import cx from "classnames";
import {
  FocusEventHandler,
  KeyboardEventHandler,
  SyntheticEvent,
  useCallback,
} from "react";

const classBase = "vuuInput";

export interface VuuInputProps extends InputProps {
  onCommit: (evt: SyntheticEvent<HTMLInputElement>) => void;
}

/**
 * A variant of Salt Input that provides a commit callback prop,
 * TODO along with cancel behaviour ?
 */
export const VuuInput = ({
  className,
  onCommit,
  onKeyDown,
  ...props
}: VuuInputProps) => {
  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLInputElement>>(
    (evt) => {
      if (evt.key === "Enter") {
        evt.preventDefault();
        evt.stopPropagation();
        onCommit(evt);
      }
      onKeyDown?.(evt);
    },
    [onCommit, onKeyDown]
  );

  const handleBlur = useCallback<FocusEventHandler<HTMLInputElement>>(
    (evt) => {
      onCommit(evt);
    },
    [onCommit]
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
