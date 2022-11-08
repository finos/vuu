import { EditableLabel } from "@heswell/uitk-lab";
import { useState } from "react";

export const EditableLabelControlledValueUncontrolledEditing = () => {
  const [value, setValue] = useState<string>("Initial value");

  const handleEnterEditMode = () => {
    console.log("handleEnterEditMode");
  };

  const handleExitEditMode = (finalValue = "") => {
    console.log(`handleExitEditMode '${value}'`);
    if (finalValue !== value) {
      // edit was cancelled
      setValue(finalValue);
    }
  };

  return (
    <div
      style={{
        display: "inline-block",
        border: "solid 1px #ccc",
        position: "absolute",
        top: 100,
        left: 100,
      }}
    >
      <EditableLabel
        value={value}
        onChange={setValue}
        onEnterEditMode={handleEnterEditMode}
        onExitEditMode={handleExitEditMode}
      />
    </div>
  );
};
