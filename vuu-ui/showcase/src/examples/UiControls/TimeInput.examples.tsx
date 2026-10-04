import { Button, Input } from "@salt-ds/core";
import { TimeInput, TimeInputProps } from "@vuu-ui/vuu-ui-controls";
import { CommitHandler, TimeString } from "@vuu-ui/vuu-utils";
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

interface TimeInputTemplateProps extends Partial<TimeInputProps> {
  /**
   * When controlled, changes are applied to state by default.
   * Set this to simulate an owner that rejects changes.
   */
  rejectChanges?: boolean;
}

const TimeInputTemplate = ({
  defaultValue,
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
        setValue(value as TimeString);
      }
      onChange?.(e);
    },
    [onChange, rejectChanges, valueProp],
  );

  const handleCommit = useCallback<CommitHandler<HTMLInputElement, TimeString>>(
    (e, value) => {
      setCommitValues((values) => [...values, value]);
      onCommit?.(e, value);
    },
    [onCommit],
  );

  const setTime = useCallback((time: TimeString) => {
    setValue(time);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 20,
        width: 120,
      }}
    >
      <div style={{ display: "flex", gap: 12 }}>
        <Button onClick={() => setTime("00:00:00")}>00:00:00</Button>
        <Button onClick={() => setTime("09:00:00")}>09:00:00</Button>
        <Button onClick={() => setTime("15:30:00")}>15:30:00</Button>
      </div>

      <Input data-testid="pre-timeinput" />
      <TimeInput
        defaultValue={defaultValue}
        onChange={handleChange}
        onCommit={handleCommit}
        value={value}
      />
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
  onChange,
  onCommit,
  rejectChanges,
  value,
}: Pick<
  TimeInputTemplateProps,
  "defaultValue" | "onChange" | "onCommit" | "rejectChanges" | "value"
>) => (
  <TimeInputTemplate
    defaultValue={defaultValue}
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
