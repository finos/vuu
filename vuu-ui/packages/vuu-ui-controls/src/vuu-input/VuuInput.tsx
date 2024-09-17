import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { CommitHandler, isValidNumber, useId } from "@finos/vuu-utils";
import { Input, InputProps, Tooltip } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  FocusEventHandler,
  ForwardedRef,
  KeyboardEventHandler,
  ReactElement,
  ReactNode,
  forwardRef,
  useCallback,
} from "react";

import vuuInputCss from "./VuuInput.css";

const classBase = "vuuInput";

export interface VuuInputProps<T extends VuuRowDataItemType = string>
  extends Omit<InputProps, "validationStatus"> {
  errorMessage?: ReactNode;
  onCommit: CommitHandler<HTMLInputElement, T | undefined>;
  type?: T;
}

/**
 * A variant of Salt Input that provides a commit callback prop,
 * TODO along with cancel behaviour ?
 */
export const VuuInput = forwardRef(function VuuInput<
  T extends VuuRowDataItemType = string,
>(
  {
    className,
    errorMessage,
    id: idProp,
    onCommit,
    onKeyDown,
    type,
    ...props
  }: VuuInputProps<T>,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-input",
    css: vuuInputCss,
    window: targetWindow,
  });

  const id = useId(idProp);

  const commitValue = useCallback<CommitHandler>(
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
    [onCommit, type],
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
    [commitValue, onKeyDown],
  );

  const handleBlur = useCallback<FocusEventHandler<HTMLInputElement>>(
    (evt) => {
      const { value } = evt.target as HTMLInputElement;
      commitValue(evt, value);
    },
    [commitValue],
  );

  const endAdornment = errorMessage ? (
    <Tooltip content={errorMessage} status="error">
      <span className={`${classBase}-errorIcon`} data-icon="error" />
    </Tooltip>
  ) : undefined;

  return (
    <>
      <Input
        {...props}
        endAdornment={endAdornment}
        id={id}
        inputProps={{
          autoComplete: "off",
          ...props.inputProps,
        }}
        className={cx(classBase, className, {
          [`${classBase}-error`]: errorMessage,
        })}
        onBlur={handleBlur}
        ref={forwardedRef}
        onKeyDown={handleKeyDown}
      />
    </>
  );
}) as <T extends VuuRowDataItemType = string>(
  props: VuuInputProps<T> & {
    ref?: ForwardedRef<HTMLDivElement>;
  },
) => ReactElement<VuuInputProps<T>>;
