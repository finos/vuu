import { Button, Input } from "@salt-ds/core";
import { TimeInput, TimeInputProps } from "@vuu-ui/vuu-ui-controls";
import { CommitHandler, TimeString } from "@vuu-ui/vuu-utils";
import { useCallback, useState } from "react";

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
  showTemplateWhileEditing,
}: Partial<TimeInputProps>) => {
  const [initialValue, setInitialValue] = useState<TimeString | undefined>(
    defaultValue,
  );

  const handleCommit = useCallback<CommitHandler<HTMLInputElement, Date>>(
    (e, value) => {
      console.log(`commit value ${value}`);
    },
    [],
  );

  const setTime = useCallback((time: TimeString) => {
    setInitialValue(time);
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
        defaultValue={initialValue}
        onChange={onChange}
        onCommit={handleCommit}
        showTemplateWhileEditing={showTemplateWhileEditing}
      />
      <Input data-testid="post-timeinput" />
    </div>
  );
};

export const VuuTimeInputShowTemplateWhileEditing = () => <TimeInputTemplate />;

export const TestTimeInput = ({
  defaultValue,
}: Pick<TimeInputProps, "defaultValue">) => (
  <TimeInputTemplate
    defaultValue={defaultValue}
    showTemplateWhileEditing={false}
  />
);

export const VuuTimeInput = () => (
  <TimeInputTemplate defaultValue="00:00:00" showTemplateWhileEditing={false} />
);

export const VuuTimeInputDefaultValue = () => (
  <TimeInputTemplate defaultValue="00:59:59" showTemplateWhileEditing={false} />
);

// TODO
// export const VuuTimeInputControlled = () => {
//   const [value, setValue] = useState<TimeString>("09:00:00");

//   const handleChange = useCallback((value: TimeString) => {
//     console.log(`value changes ${value}`);
//   }, []);

//   return (
//     <TimeInputTemplate
//       onChange={handleChange}
//       value={value}
//       showTemplateWhileEditing={false}
//     />
//   );
// };
