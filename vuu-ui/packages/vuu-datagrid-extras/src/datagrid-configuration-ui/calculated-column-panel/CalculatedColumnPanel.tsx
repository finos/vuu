import { FormField, Input, Panel } from "@heswell/salt-lab";
import { Button, Text } from "@salt-ds/core";
import {
  ChangeEventHandler,
  Dispatch,
  HTMLAttributes,
  useCallback,
  useState,
} from "react";
import { ColumnAction } from "../settings-panel/useGridSettings";

export interface CalculatedColumnPanelProps
  extends HTMLAttributes<HTMLDivElement> {
  dispatchColumnAction: Dispatch<ColumnAction>;
}

export const CalculatedColumnPanel = ({
  dispatchColumnAction,
}: CalculatedColumnPanelProps) => {
  const [columnName, setColumnName] = useState("");
  const [expression, setExpression] = useState("");

  const handleChangeName: ChangeEventHandler<HTMLInputElement> = useCallback(
    (evt) => {
      const { value } = evt.target as HTMLInputElement;
      setColumnName(value);
    },
    []
  );
  const handleChangeExpression: ChangeEventHandler<HTMLInputElement> =
    useCallback((evt) => {
      const { value } = evt.target as HTMLInputElement;
      setExpression(value);
    }, []);

  const handleSave = useCallback(() => {
    dispatchColumnAction({
      type: "addCalculatedColumn",
      columnName,
      expression,
      columnType: "string",
    });
  }, [columnName, dispatchColumnAction, expression]);

  return (
    <Panel title="Define Computed Column">
      <Text styleAs="h4">Define Computed Column</Text>
      <FormField label="Column Name" labelPlacement="left">
        <Input value={columnName} onChange={handleChangeName} />
      </FormField>
      <FormField label="Column Expression" labelPlacement="top">
        <Input value={expression} onChange={handleChangeExpression} />
      </FormField>
      <div style={{ marginTop: 12 }}>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </Panel>
  );
};
