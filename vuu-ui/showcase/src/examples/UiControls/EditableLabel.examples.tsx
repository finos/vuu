import {
  EditableLabel,
  ExitEditModeHandler,
  Icon,
} from "@vuu-ui/vuu-ui-controls";
import { Button, Input } from "@salt-ds/core";
import { ReactNode, useRef, useState } from "react";

const ExpandoContainer = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      alignItems: "center",
      border: "solid 1px black",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: 12,
      width: 300,
    }}
  >
    <Input />
    {children}
    <Input />
  </div>
);

export const EditableLabelControlledValueUncontrolledEditing = () => {
  const [value, setValue] = useState<string>("Initial value");
  const [editing, setEditing] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);

  const handleEnterEditMode = () => {
    console.log("handleEnterEditMode");
  };

  const handleExitEditMode: ExitEditModeHandler = (
    originalValue,
    finalValue = "",
  ) => {
    console.log(`handleExitEditMode finalValue ${finalValue} value '${value}'`);
    if (finalValue !== value) {
      setValue(finalValue);
    }
    setEditing(false);
    requestAnimationFrame(() => {
      editButtonRef.current?.focus();
    });
  };

  const beginEdit = () => {
    requestAnimationFrame(() => {
      setEditing(true);
    });
  };

  return (
    <ExpandoContainer>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          padding: 4,
          flex: "0 0 40px",
        }}
      >
        <EditableLabel
          editing={editing}
          value={value}
          onChange={setValue}
          onEnterEditMode={handleEnterEditMode}
          onExitEditMode={handleExitEditMode}
        />

        <Button
          className="vuuIconButton"
          disabled={editing}
          ref={editButtonRef}
          onClick={beginEdit}
        >
          <Icon name="edit" />
        </Button>
      </div>
    </ExpandoContainer>
  );
};
