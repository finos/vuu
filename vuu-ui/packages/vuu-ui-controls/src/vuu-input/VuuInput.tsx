import { Tooltip, useTooltip } from "@finos/vuu-popups";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { isValidNumber, useId } from "@finos/vuu-utils";
import { Input, InputProps } from "@salt-ds/core";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  FocusEventHandler,
  ForwardedRef,
  forwardRef,
  KeyboardEventHandler,
  ReactElement,
  SyntheticEvent,
  useCallback,
} from "react";

import vuuInputCss from "./VuuInput.css";

const classBase = "vuuInput";

const constantInputProps = {
  autoComplete: "off",
};

export type Commithandler<T extends VuuRowDataItemType = string> = (
  evt: SyntheticEvent<HTMLInputElement>,
  value: T
) => void;
export interface VuuInputProps<T extends VuuRowDataItemType = string>
  extends InputProps {
  errorMessage?: string;
  onCommit: Commithandler<T>;
  type?: T;
}

/**
 * A variant of Salt Input that provides a commit callback prop,
 * TODO along with cancel behaviour ?
 */
export const VuuInput = forwardRef(function VuuInput<
  T extends VuuRowDataItemType = string
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
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-input",
    css: vuuInputCss,
    window: targetWindow,
  });

  const id = useId(idProp);
  const { anchorProps, tooltipProps } = useTooltip({
    id,
    tooltipContent: errorMessage,
  });

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

  const endAdornment = errorMessage ? (
    <span
      {...anchorProps}
      className={`${classBase}-errorIcon`}
      data-icon="error"
    />
  ) : undefined;

  return (
    <>
      <Input
        {...props}
        endAdornment={endAdornment}
        id={id}
        inputProps={{
          ...constantInputProps,
          ...props.inputProps,
        }}
        className={cx(classBase, className, {
          [`${classBase}-error`]: errorMessage,
        })}
        onBlur={handleBlur}
        ref={forwardedRef}
        onKeyDown={handleKeyDown}
      />
      {tooltipProps ? <Tooltip {...tooltipProps} status="error" /> : null}
    </>
  );
}) as <T extends VuuRowDataItemType = string>(
  props: VuuInputProps<T> & {
    ref?: ForwardedRef<HTMLDivElement>;
  }
) => ReactElement<VuuInputProps<T>>;
