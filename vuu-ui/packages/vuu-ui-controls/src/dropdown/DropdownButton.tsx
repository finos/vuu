import { Button, ButtonProps } from "@salt-ds/core";
import cx from "clsx";
import { AriaAttributes, ForwardedRef, forwardRef } from "react";

import "./DropdownButton.css";

export interface DropdownButtonProps extends ButtonProps {
  /**
   * Replace the default Icon component
   */
  icon?: string;
  /**
   * Whether the dropdown button should hide role='option' via 'aria-hidden'
   */
  ariaHideOptionRole?: boolean;
  /**
   * If, `true`, the Dropdown button will occupy the full width of it's container
   */
  fullWidth?: boolean;
  /**
   * Is the dropdown list open
   */
  isOpen?: boolean;
  /**
   * Label for the dropdown button
   */
  label?: string;
  /**
   * Id for the label. This is needed for ARIA attributes.
   */
  labelId?: string;
  /**
   * When the dropdown is collapsed this value is set as aria-posinset on the span containing the selected value
   * **/
  posInSet?: number;
  /**
   * When the dropdown is collapsed this value is set as aria-setsize on the span containing the selected value
   * **/
  setSize?: number;
  /**
   *
   * **/
  labelAriaAttributes?: Pick<
    AriaAttributes,
    "aria-posinset" | "aria-setsize" | "aria-selected"
  >;
}

const classBase = "vuuDropdownButton";

export const DropdownButton = forwardRef(function DropdownButton(
  {
    ariaHideOptionRole,
    className,
    disabled,
    icon = "chevron-down",
    isOpen,
    label,
    labelId,
    fullWidth,
    posInSet,
    setSize,
    labelAriaAttributes,
    ...rest
  }: DropdownButtonProps,
  ref: ForwardedRef<HTMLButtonElement>
) {
  // FIXME: use polymorphic button
  // We don't want the 'button' tag to be shown in the DOM to trigger some accessibility testing
  // tool's false alarm on role of 'listbox'
  return (
    <Button
      className={cx(
        classBase,
        {
          [`${classBase}-fullWidth`]: fullWidth,
        },
        className
      )}
      disabled={disabled}
      variant="secondary"
      {...rest}
      ref={ref}
    >
      <div className={`${classBase}-content`}>
        <span
          // 'hidden' so that screen reader won't be confused the additional 'option' which is just a label
          aria-hidden={ariaHideOptionRole ? "true" : undefined}
          {...labelAriaAttributes}
          className={`${classBase}-buttonLabel`}
          id={labelId}
          // 'option' role here is to suppress accessibility testing tool warning about 'listbox' missing children role.
          role="option"
        >
          {label}
        </span>
        <span
          className={`${classBase}-buttonIcon`}
          data-icon={icon}
          aria-hidden="true"
        />
      </div>
    </Button>
  );
});
