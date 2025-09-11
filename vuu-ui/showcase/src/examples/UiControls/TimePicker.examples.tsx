import { Button, Input } from "@salt-ds/core";
import { VuuTimePicker, VuuTimePickerProps } from "@vuu-ui/vuu-ui-controls";
import { asTimeString, CommitHandler, TimeString } from "@vuu-ui/vuu-utils";
import { ChangeEventHandler, useCallback, useMemo, useState } from "react";

const TimePickerTemplate = ({
  defaultValue,
  onChange,
  value: valueProp,
}: Partial<VuuTimePickerProps>) => {
  const [value, setValue] = useState(valueProp);

  useMemo(() => {
    setValue(valueProp);
  }, [valueProp]);

  const handleCommit = useCallback<CommitHandler<HTMLInputElement, TimeString>>(
    (e, value) => {
      console.log(`commit value ${value}`);
    },
    [],
  );

  const setTime = useCallback((time: TimeString) => {
    console.log(`set time ${time}`);
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
      <VuuTimePicker
        data-testid="timeinput"
        defaultValue={defaultValue}
        onChange={onChange}
        onCommit={handleCommit}
        value={value}
      />
      <Input data-testid="post-timeinput" />
    </div>
  );
};

export const DefaultTimePicker = () => (
  <TimePickerTemplate defaultValue="00:00:00" />
);

export const ControlledVuuTimePicker = () => {
  const [value, setValue] = useState<TimeString>("00:00:00");

  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      const { value } = e.target;
      setValue(asTimeString(value, false));
    },
    [],
  );

  return <TimePickerTemplate onChange={handleChange} value={value} />;
};
