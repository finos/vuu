import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ForwardedRef, forwardRef } from "react";
import { VuuInput, VuuInputProps } from "../vuu-input";

import expandoInputCss from "./ExpandoInput.css";

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
    ...props
  }: ExpandoInputProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-expando-input",
    css: expandoInputCss,
    window: targetWindow,
  });

  return (
    <div
      className={cx(classBase, classNameProp, {
        [`${classBase}-error`]: errorMessage,
      })}
      data-text={value}
    >
      <VuuInput
        {...props}
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
