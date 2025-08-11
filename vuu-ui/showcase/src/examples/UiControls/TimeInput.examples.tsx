import { Input } from "@salt-ds/core";
import { TimeInput } from "@vuu-ui/vuu-ui-controls";
import { CommitHandler } from "@vuu-ui/vuu-utils";
import { useCallback } from "react";

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

export const VuuTimeInputShowTemplateWhileEditing = () => {
  const handleCommit = useCallback<CommitHandler<HTMLInputElement, Date>>(
    (e, value) => {
      console.log(`commit value ${value}`);
    },
    [],
  );

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
      <Input />
      <TimeInput onCommit={handleCommit} />
      <Input />
    </div>
  );
};

export const VuuTimeInput = () => {
  const handleCommit = useCallback<CommitHandler<HTMLInputElement, Date>>(
    (e, value) => {
      console.log(`commit value ${value}`);
    },
    [],
  );
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
      <Input />
      <TimeInput onCommit={handleCommit} showTemplateWhileEditing={false} />
      <Input />
    </div>
  );
};

export const VuuTimeInputDefaultValue = () => {
  const handleCommit = useCallback<CommitHandler<HTMLInputElement, Date>>(
    (e, value) => {
      console.log(`commit value ${value}`);
    },
    [],
  );
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
      <Input />
      <TimeInput
        defaultValue="00:59:59"
        onCommit={handleCommit}
        showTemplateWhileEditing={false}
      />
      <Input />
    </div>
  );
};
