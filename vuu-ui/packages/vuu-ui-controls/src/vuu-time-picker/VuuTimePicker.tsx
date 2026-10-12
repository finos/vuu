import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes } from "react";
import {
  TimeInput,
  TimeInputMillisecondsProps,
  TimeInputProps,
  TimeInputSecondsProps,
} from "../time-input/TimeInput";

import timePickerCss from "./VuuTimePicker.css";

type VuuTimePickerHtmlAttributes = Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange" | "value"
>;

type TimePickerInputProps =
  "defaultValue" | "milliseconds" | "onChange" | "onCommit" | "value";

export type VuuTimePickerSecondsProps = Pick<
  TimeInputSecondsProps,
  TimePickerInputProps
> &
  VuuTimePickerHtmlAttributes;

export type VuuTimePickerMillisecondsProps = Pick<
  TimeInputMillisecondsProps,
  TimePickerInputProps
> &
  VuuTimePickerHtmlAttributes;

export type VuuTimePickerProps =
  VuuTimePickerSecondsProps | VuuTimePickerMillisecondsProps;

const classBase = "vuuTimePicker";

export const VuuTimePicker = ({
  className,
  defaultValue,
  milliseconds,
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
        {...({
          defaultValue,
          milliseconds,
          onChange,
          onCommit,
          value,
        } as TimeInputProps)}
      />
    </div>
  );
};
