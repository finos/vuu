import { Button, Input } from "@salt-ds/core";
import { TimeInput, TimeInputProps } from "@vuu-ui/vuu-ui-controls";
import { CommitHandler, TimeString } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useState } from "react";

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

const TimeInputTemplate = ({
  defaultValue,
  onChange,
  value: valueProp,
}: Partial<TimeInputProps>) => {
  const [value, setValue] = useState(valueProp);

  useMemo(() => {
    setValue(valueProp);
  }, [valueProp]);

  const handleChange = useCallback(
    (value: TimeString) => {
      console.log(`change value ${value}`);
      onChange?.(value);
    },
    [onChange],
  );

  const handleCommit = useCallback<CommitHandler<HTMLInputElement, Date>>(
    (e, value) => {
      console.log(`commit value ${value}`);
    },
    [],
  );

  const setTime = useCallback((time: TimeString) => {
    console.log(`set time ${time}`);
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
        data-testid="timeinput"
        defaultValue={defaultValue}
        onChange={handleChange}
        onCommit={handleCommit}
        value={value}
      />
      <Input data-testid="post-timeinput" />
    </div>
  );
};

export const TestTimeInput = ({
  defaultValue,
}: Pick<TimeInputProps, "defaultValue">) => (
  <TimeInputTemplate defaultValue={defaultValue} />
);

export const VuuTimeInput = () => <TimeInputTemplate defaultValue="00:00:00" />;

export const VuuTimeInputDefaultValue = () => (
  <TimeInputTemplate defaultValue="00:59:59" />
);

// TODO
export const VuuTimeInputControlled = () => {
  const [value, setValue] = useState<TimeString>("09:00:00");

  const handleChange = useCallback((value: TimeString) => {
    console.log(`setValue ${value}`);
    setValue(value);
  }, []);

  return <TimeInputTemplate onChange={handleChange} value={value} />;
};
