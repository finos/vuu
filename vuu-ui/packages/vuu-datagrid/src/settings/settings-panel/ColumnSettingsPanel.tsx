import { FormField, Input, StepperInput } from "@heswell/salt-lab";
import { Text } from "@salt-ds/core";
import { HTMLAttributes } from "react";
import { KeyedColumnDescriptor } from "../../grid-model";
import "./ColumnSettingsPanel.css";

const classBase = "vuuColumnSettingsPanel";

export interface ColumnSettingsPanelProps
  extends HTMLAttributes<HTMLDivElement> {
  column: KeyedColumnDescriptor | null;
}
export const ColumnSettingsPanel = ({
  column,
  style: styleProp,
  ...props
}: ColumnSettingsPanelProps) => {
  const type = column?.type;
  console.log(`colunn type ${type}`);
  return (
    <div
      className={classBase}
      {...props}
      style={{
        ...styleProp,
      }}
    >
      <Text as="h4">Column Settings</Text>
      <div>
        <span>{column?.name}</span>
        <span>{column?.serverDataType}</span>
      </div>
      <FormField label="Label" labelPlacement="left">
        <Input value={column?.label ?? column?.name} />
      </FormField>
      <FormField label="Width" labelPlacement="left">
        <StepperInput value={120} />
      </FormField>
    </div>
  );
};
