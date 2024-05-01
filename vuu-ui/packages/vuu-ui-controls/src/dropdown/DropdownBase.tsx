import { PopupComponent as Popup, Portal } from "@finos/vuu-popups";
import { useId } from "@finos/vuu-utils";
import { useForkRef } from "@salt-ds/core";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { Children, cloneElement, forwardRef, useRef } from "react";
import { forwardCallbackProps } from "../utils";
import { DropdownBaseProps } from "./dropdownTypes";
import { useDropdownBase } from "./useDropdownBase";

import dropdownBaseCss from "./Dropdown.css";

// Any component may be passed as our trigger or popup component.
// Define the common props that we will act on, if present,
// so we can type them.
export type MaybeChildProps = {
  className?: string;
  id?: string;
  role?: string;
  width: number | string;
};

const classBase = "vuuDropdown";

export const DropdownBase = forwardRef<HTMLDivElement, DropdownBaseProps>(
  function Dropdown(
    {
      PopupProps,
      "aria-labelledby": ariaLabelledByProp,
      children,
      className: classNameProp,
      defaultIsOpen,
      disabled,
      fullWidth,
      id: idProp,
      isOpen: isOpenProp,
      onKeyDown,
      onOpenChange,
      openKeys,
      openOnFocus,
      placement = "below-full-width",
      popupWidth,
      width,
      ...htmlAttributes
    },
    forwardedRef
  ) {
    const targetWindow = useWindow();
    useComponentCssInjection({
      testId: "vuu-dropdown-base",
      css: dropdownBaseCss,
      window: targetWindow,
    });

    const rootRef = useRef<HTMLDivElement>(null);
    const className = cx(classBase, classNameProp, {
      [`${classBase}-fullWidth`]: fullWidth,
      [`${classBase}-disabled`]: disabled,
    });
    const [trigger, popupComponent] = Children.toArray(
      children
    ) as JSX.Element[];
    const id = useId(idProp);

    const { componentProps, isOpen, popupComponentRef, triggerProps } =
      useDropdownBase({
        ariaLabelledBy: ariaLabelledByProp,
        defaultIsOpen,
        disabled,
        fullWidth,
        id,
        isOpen: isOpenProp,
        onOpenChange,
        onKeyDown,
        openKeys,
        openOnFocus,
        popupComponent,
        popupWidth,
        rootRef,
        width,
      });

    const getTriggerComponent = () => {
      const {
        id: defaultId,
        role: defaultRole,
        ...restTriggerProps
      } = triggerProps;

      const {
        id = defaultId,
        role = defaultRole,
        ...ownProps
      } = trigger.props as MaybeChildProps;

      return cloneElement(
        trigger,
        forwardCallbackProps(ownProps, {
          ...restTriggerProps,
          id,
          role,
        })
      );
    };

    const getPopupComponent = () => {
      const { id: defaultId, width, ...restComponentProps } = componentProps;
      const {
        className,
        id = defaultId,
        width: ownWidth,
        ...ownProps
      } = popupComponent.props as MaybeChildProps;

      return cloneElement(popupComponent, {
        ...ownProps,
        ...restComponentProps,
        className: cx(className, `${classBase}-popup-component`),
        id,
        ref: popupComponentRef,
        width: placement.endsWith("full-width") ? "auto" : ownWidth ?? width,
      });
    };

    const ref = useForkRef(rootRef, forwardedRef);

    return (
      <div {...htmlAttributes} className={className} id={idProp} ref={ref}>
        {getTriggerComponent()}
        {isOpen && (
          <Portal>
            <Popup
              {...PopupProps}
              anchorElement={rootRef}
              placement={placement}
            >
              {getPopupComponent()}
            </Popup>
          </Portal>
        )}
      </div>
    );
  }
);
