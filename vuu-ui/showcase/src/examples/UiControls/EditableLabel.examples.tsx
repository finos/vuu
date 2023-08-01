import { EditableLabel } from "@finos/vuu-ui-controls";
import { useState } from "react";

let displaySequence = 1;

export const EditableLabelControlledValueUncontrolledEditing = () => {
  const [value, setValue] = useState<string>("Initial value");

  const handleEnterEditMode = () => {
    console.log("handleEnterEditMode");
  };

  const handleExitEditMode = (finalValue = "") => {
    console.log(`handleExitEditMode '${value}'`);
    if (finalValue !== value) {
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
EditableLabelControlledValueUncontrolledEditing.displaySequence =
  displaySequence++;
