import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { CommitHandler } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { HTMLAttributes, useCallback } from "react";
import { TimeInput } from "../time-input/TimeInput";

import timePickerCss from "./VuuTimePicker.css";

export interface VuuTimePickerProps extends HTMLAttributes<HTMLDivElement> {
  onCommit: CommitHandler<HTMLElement, number>;
}

const classBase = "vuuTimePicker";

export const VuuTimePicker = ({
  className,
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
      console.log(value);
    },
    [],
  );

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      <TimeInput onCommit={handleCommit} />
    </div>
  );
};
