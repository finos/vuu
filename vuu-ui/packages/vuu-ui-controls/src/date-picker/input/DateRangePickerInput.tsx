import { useCallback } from "react";
import { DateValue } from "@internationalized/date";
import { clsx } from "clsx";
import { DatePickerInput } from "./DatePickerInput";
import { BasePickerInputProps } from "./types";
import { RangeSelectionValueType } from "../../calendar";

import "./DateRangePickerInput.css";

const baseClass = "vuuDateRangePickerInput";

type Props = BasePickerInputProps<RangeSelectionValueType>;

export const DateRangePickerInput: React.FC<Props> = (props) => {
  const { value, onChange, className } = props;

  const getHandleInputChange = useCallback(
    (k: keyof RangeSelectionValueType) => (d: DateValue) => {
      onChange({ ...value, [k]: d });
    },
    [value, onChange]
  );

  return (
    <div className={clsx(baseClass, className)}>
      <DatePickerInput
        value={value?.["startDate"]}
        onChange={getHandleInputChange("startDate")}
      />
      <span>—</span>
      <DatePickerInput
        value={value?.["endDate"]}
        onChange={getHandleInputChange("endDate")}
      />
    </div>
  );
};
