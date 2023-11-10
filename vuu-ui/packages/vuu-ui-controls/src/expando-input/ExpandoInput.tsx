import { VuuInput, VuuInputProps } from "@finos/vuu-ui-controls";
import cx from "classnames";
import { ForwardedRef, forwardRef } from "react";

import "./ExpandoInput.css";

const classBase = "vuuExpandoInput";

const noop = () => undefined;

export interface ExpandoInputProps extends Omit<VuuInputProps, "onCommit"> {
  onCommit?: VuuInputProps["onCommit"];
}

export const ExpandoInput = forwardRef(function ExpandoInput(
  {
    className: classNameProp,
    errorMessage,
    value,
    inputProps,
    onCommit = noop,
    ...InputProps
  }: ExpandoInputProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  return (
    <div
      className={cx(classBase, classNameProp, {
        [`${classBase}-error`]: errorMessage,
      })}
      data-text={value}
    >
      <VuuInput
        {...InputProps}
        errorMessage={errorMessage}
        inputProps={{ ...inputProps, className: `${classBase}-input` }}
        onCommit={onCommit}
        ref={forwardedRef}
        style={{ padding: 0 }}
        textAlign="left"
        value={value}
        variant="secondary"
      />
    </div>
  );
});
