import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes } from "react";
import { TimeInputHookProps, useTimeInput } from "./useTimeInput";

import timeInputCss from "./TimeInput.css";
import { TimeString } from "@vuu-ui/vuu-utils";

const zeroTime: TimeString = "00:00:00";

export interface TimeInputProps
  extends TimeInputHookProps,
    Omit<HTMLAttributes<HTMLInputElement>, "defaultValue">,
    Partial<Pick<HTMLInputElement, "placeholder">> {}

export const TimeInput = ({
  className,
  date,
  defaultValue = zeroTime,
  onCommit,
  placeholder = "hh:mm:ss",
  showTemplateWhileEditing,
}: TimeInputProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-time-input",
    css: timeInputCss,
    window: targetWindow,
  });

  const { inputRef, eventHandlers } = useTimeInput({
    date,
    defaultValue,
    onCommit,
    showTemplateWhileEditing,
  });

  return (
    <input
      {...eventHandlers}
      aria-placeholder={placeholder}
      className={cx("TimeInput", className)}
      defaultValue={defaultValue}
      placeholder={placeholder}
      ref={inputRef}
      spellCheck="false"
    />
  );
};
