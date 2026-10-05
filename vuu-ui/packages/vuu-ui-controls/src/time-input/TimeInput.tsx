import { useForkRef } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { normaliseTimeString } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { forwardRef, HTMLAttributes } from "react";
import {
  TimeInputHookProps,
  TimeInputMillisecondsProps,
  TimeInputSecondsProps,
  useTimeInput,
} from "./useTimeInput";

import timeInputCss from "./TimeInput.css";

const classBase = "vuuTimeInput";

type TimeInputHtmlAttributes = Omit<
  HTMLAttributes<HTMLInputElement>,
  "defaultValue" | "onChange" | "value"
> &
  Partial<Pick<HTMLInputElement, "placeholder">>;

export type { TimeInputMillisecondsProps, TimeInputSecondsProps };

export type TimeInputProps = TimeInputHookProps & TimeInputHtmlAttributes;

export const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(
  function TimeInput(
    {
      className,
      date,
      defaultValue,
      milliseconds = false,
      onChange,
      onCommit,
      placeholder = milliseconds ? "hh:mm:ss.sss" : "hh:mm:ss",
      value,
      ...htmlAttributes
    },
    ref,
  ) {
    const targetWindow = useWindow();
    useComponentCssInjection({
      testId: "vuu-time-input",
      css: timeInputCss,
      window: targetWindow,
    });

    const { inputRef, eventHandlers } = useTimeInput({
      date,
      defaultValue,
      milliseconds,
      onChange,
      onCommit,
      value,
    } as TimeInputHookProps);

    // Ensure displayed value has the configured precision
    const displayValue =
      value === undefined
        ? undefined
        : (normaliseTimeString(value, milliseconds) ?? value);
    const displayDefaultValue =
      value === undefined && defaultValue !== undefined
        ? (normaliseTimeString(defaultValue, milliseconds) ?? defaultValue)
        : undefined;

    return (
      <input
        {...htmlAttributes}
        {...eventHandlers}
        aria-placeholder={placeholder}
        className={cx(classBase, className, {
          [`${classBase}-milliseconds`]: milliseconds,
        })}
        defaultValue={displayDefaultValue}
        placeholder={placeholder}
        readOnly
        ref={useForkRef(ref, inputRef)}
        spellCheck="false"
        value={displayValue}
      />
    );
  },
);
