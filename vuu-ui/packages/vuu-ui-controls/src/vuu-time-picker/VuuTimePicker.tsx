import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { CommitHandler } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { HTMLAttributes, useCallback } from "react";
import { TimeInput, TimeInputProps } from "../time-input/TimeInput";

import timePickerCss from "./VuuTimePicker.css";

export interface VuuTimePickerProps
  extends Pick<TimeInputProps, "defaultValue">,
    Omit<HTMLAttributes<HTMLDivElement>, "defaultValue"> {
  onCommit: CommitHandler<HTMLElement, number>;
}

const classBase = "vuuTimePicker";

export const VuuTimePicker = ({
  className,
  defaultValue = "00:00:00",
  onCommit,
  ...htmlAttributes
}: VuuTimePickerProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-time-picker",
    css: timePickerCss,
    window: targetWindow,
  });

  const handleCommit = useCallback<CommitHandler<HTMLInputElement, Date>>(
    (e, value) => {
      // TOCHECK - onCommit call required here?.. and value in numeric?
      console.log(value);
    },
    [],
  );

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      <TimeInput defaultValue={defaultValue} onCommit={handleCommit} />
    </div>
  );
};
