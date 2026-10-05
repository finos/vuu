import { Button, Input } from "@salt-ds/core";
import { TimeInput, type TimeInputProps } from "@vuu-ui/vuu-ui-controls";
import type {
  CommitHandler,
  TimeString,
  TimeStringMillis,
} from "@vuu-ui/vuu-utils";
import { ChangeEventHandler, useCallback, useMemo, useState } from "react";

export const NativeHtmlTimeInput = () => {
  return (
    <div style={{ padding: 20 }}>
      <style>
        {`
            input[type="time"]{
                border: solid 1px red;
            }

            input::-webkit-datetime-edit {
                background: pink;
            }
            input::-webkit-datetime-edit-fields-wrapper {
                background: yellow;
            }
            input::-webkit-datetime-edit-hour-field {
                color: blue;
            }
            input::-webkit-datetime-edit-minute-field {
                color: green;
            }
            input::-webkit-datetime-edit-second-field {
                color: brown;
            }
            input::-webkit-calendar-picker-indicator {
                background: cyan;
            }
        `}
      </style>
      <input type="time" step="1"></input>
    </div>
  );
};

type TimeValue = TimeString | TimeStringMillis;

interface TimeInputTemplateProps {
  defaultValue?: TimeValue;
  milliseconds?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onCommit?: CommitHandler<HTMLInputElement, TimeValue>;
  /**
   * When controlled, changes are applied to state by default.
   * Set this to simulate an owner that rejects changes.
   */
  rejectChanges?: boolean;
  value?: TimeValue;
}

const presetTimes: TimeValue[] = ["00:00:00", "09:00:00", "15:30:00"];
const presetTimesMillis: TimeValue[] = [
  "00:00:00.000",
  "09:00:00.250",
  "15:30:00.999",
];

const TimeInputTemplate = ({
  defaultValue,
  milliseconds = false,
  onChange,
  onCommit,
  rejectChanges = false,
  value: valueProp,
}: TimeInputTemplateProps) => {
  const [value, setValue] = useState(valueProp);
  const [changeValues, setChangeValues] = useState<string[]>([]);
  const [commitValues, setCommitValues] = useState<string[]>([]);

  useMemo(() => {
    setValue(valueProp);
  }, [valueProp]);

  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      const { value } = e.target;
      setChangeValues((values) => [...values, value]);
      if (valueProp !== undefined && !rejectChanges) {
        setValue(value as TimeValue);
      }
      onChange?.(e);
    },
    [onChange, rejectChanges, valueProp],
  );

  const handleCommit = useCallback<CommitHandler<HTMLInputElement, TimeValue>>(
    (e, value) => {
      setCommitValues((values) => [...values, value]);
      onCommit?.(e, value);
    },
    [onCommit],
  );

  // The template supports both precisions, TimeInput props are typed by precision
  const timeInputProps = {
    defaultValue,
    milliseconds,
    onChange: handleChange,
    onCommit: handleCommit,
    value,
  } as TimeInputProps;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 20,
        width: milliseconds ? 160 : 120,
      }}
    >
      <div style={{ display: "flex", gap: 12 }}>
        {(milliseconds ? presetTimesMillis : presetTimes).map((time) => (
          <Button key={time} onClick={() => setValue(time)}>
            {time}
          </Button>
        ))}
      </div>

      <Input data-testid="pre-timeinput" />
      <TimeInput {...timeInputProps} />
      <input
        data-testid="time-input-change-values"
        type="hidden"
        value={JSON.stringify(changeValues)}
        readOnly
      />
      <input
        data-testid="time-input-commit-values"
        type="hidden"
        value={JSON.stringify(commitValues)}
        readOnly
      />
      <Input data-testid="post-timeinput" />
    </div>
  );
};

export const TestTimeInput = ({
  defaultValue,
  milliseconds,
  onChange,
  onCommit,
  rejectChanges,
  value,
}: TimeInputTemplateProps) => (
  <TimeInputTemplate
    defaultValue={defaultValue}
    milliseconds={milliseconds}
    onChange={onChange}
    onCommit={onCommit}
    rejectChanges={rejectChanges}
    value={value}
  />
);

export const WithDefaultValue = () => (
  <TimeInputTemplate defaultValue="00:00:00" />
);

export const VuuTimeInput = () => <TimeInputTemplate defaultValue="00:00:00" />;

export const VuuTimeInputDefaultValue = () => (
  <TimeInputTemplate defaultValue="00:59:59" />
);

export const VuuTimeInputControlled = () => (
  <TimeInputTemplate value="09:00:00" />
);

export const VuuTimeInputMilliseconds = () => (
  <TimeInputTemplate milliseconds />
);

export const VuuTimeInputMillisecondsDefaultValue = () => (
  <TimeInputTemplate defaultValue="12:34:56.789" milliseconds />
);

export const VuuTimeInputMillisecondsControlled = () => (
  <TimeInputTemplate milliseconds value="09:00:00.250" />
);
