import { useForkRef } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { forwardRef, HTMLAttributes } from "react";
import { TimeInputHookProps, useTimeInput } from "./useTimeInput";

import timeInputCss from "./TimeInput.css";

const classBase = "vuuTimeInput";

export interface TimeInputProps
  extends TimeInputHookProps,
    Omit<
      HTMLAttributes<HTMLInputElement>,
      "defaultValue" | "onChange" | "value"
    >,
    Partial<Pick<HTMLInputElement, "placeholder">> {}

export const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(
  function TimeInput(
    {
      className,
      date,
      defaultValue,
      onChange,
      onCommit,
      placeholder = "hh:mm:ss",
      showTemplateWhileEditing,
      value,
      ...htmlAttributes
    },
    ref,
  ) {
    console.log(`TimeInput defaultValue = ${defaultValue}, value=${value}`);
    const targetWindow = useWindow();
    useComponentCssInjection({
      testId: "vuu-time-input",
      css: timeInputCss,
      window: targetWindow,
    });

    const { inputRef, eventHandlers } = useTimeInput({
      date,
      defaultValue,
      onChange,
      onCommit,
      showTemplateWhileEditing,
      value,
    });

    return (
      <input
        {...htmlAttributes}
        {...eventHandlers}
        aria-placeholder={placeholder}
        className={cx(classBase, className)}
        defaultValue={defaultValue}
        key={defaultValue}
        placeholder={placeholder}
        ref={useForkRef(ref, inputRef)}
        spellCheck="false"
        value={value}
      />
    );
  },
);
