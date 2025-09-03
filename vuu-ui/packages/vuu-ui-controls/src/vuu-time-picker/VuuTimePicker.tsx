import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { CommitHandler, TimeString } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { HTMLAttributes } from "react";
import { TimeInput, TimeInputProps } from "../time-input/TimeInput";

import timePickerCss from "./VuuTimePicker.css";

export interface VuuTimePickerProps
  extends Pick<TimeInputProps, "defaultValue" | "onChange" | "value">,
    Omit<
      HTMLAttributes<HTMLDivElement>,
      "defaultValue" | "onChange" | "value"
    > {
  onCommit: CommitHandler<HTMLInputElement, TimeString>;
}

const classBase = "vuuTimePicker";

export const VuuTimePicker = ({
  className,
  defaultValue,
  onChange,
  onCommit,
  value,
  ...htmlAttributes
}: VuuTimePickerProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-time-picker",
    css: timePickerCss,
    window: targetWindow,
  });

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      <TimeInput
        defaultValue={defaultValue}
        onChange={onChange}
        onCommit={onCommit}
        value={value}
      />
    </div>
  );
};
