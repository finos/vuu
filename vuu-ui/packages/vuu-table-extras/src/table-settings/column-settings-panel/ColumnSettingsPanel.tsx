import { ColumnDescriptor, PinLocation } from "@finos/vuu-datagrid-types";
import { Stack } from "@finos/vuu-layout";
import { StepperInput } from "@salt-ds/lab";
import {
  Checkbox,
  FormField,
  FormFieldLabel,
  Input,
  Panel,
  RadioButton,
  RadioButtonGroup,
  Text,
} from "@salt-ds/core";
import cx from "classnames";
import {
  ChangeEvent,
  Dispatch,
  HTMLAttributes,
  useCallback,
  useState,
} from "react";
import { ColumnTypePanel } from "../column-type-panel";

import { ColumnAction } from "../settings-panel/useGridSettings";
import "./ColumnSettingsPanel.css";

const classBase = "vuuColumnSettingsPanel";

const tabstripProps = {
  className: "salt-density-high",
};

export interface ColumnSettingsPanelProps
  extends HTMLAttributes<HTMLDivElement> {
  column: ColumnDescriptor;
  dispatchColumnAction: Dispatch<ColumnAction>;
}
export const ColumnSettingsPanel = ({
  column,
  dispatchColumnAction,
  style: styleProp,
  ...props
}: ColumnSettingsPanelProps) => {
  const [activeTab, setActiveTab] = useState(0);

  const dispatchUpdate = useCallback(
    (
      values: Partial<
        Pick<ColumnDescriptor, "align" | "hidden" | "label" | "pin" | "width">
      >
    ) =>
      dispatchColumnAction({
        type: "updateColumnProp",
        column,
        ...values,
      }),
    [column, dispatchColumnAction]
  );

  const handleChangeAlign = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) =>
      dispatchUpdate({ align: evt.target.value as "left" | "right" }),
    [dispatchUpdate]
  );

  const handleChangePin = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) =>
      dispatchUpdate({ pin: evt.target.value as PinLocation | undefined }),
    [dispatchUpdate]
  );

  const handleChangeHidden = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) =>
      dispatchUpdate({ hidden: evt.target.checked }),
    [dispatchUpdate]
  );

  const handleChangeLabel = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) =>
      dispatchUpdate({ label: evt.target.value }),
    [dispatchUpdate]
  );

  const handleChangeWidth = useCallback(
    (value: string | number) =>
      dispatchUpdate({ width: parseInt(value.toString(), 10) }),
    [dispatchUpdate]
  );

  return (
    <div
      className={classBase}
      {...props}
      style={{
        ...styleProp,
      }}
    >
      <Text as="h4">Column Settings</Text>
      <Stack
        active={activeTab}
        showTabs
        className={cx(`${classBase}-columnTabs`)}
        onTabSelectionChanged={setActiveTab}
        TabstripProps={tabstripProps}
      >
        <Panel title="Column">
          <FormField labelPlacement="left">
            <FormFieldLabel>Hidden</FormFieldLabel>
            <Checkbox
              checked={column.hidden === true}
              onChange={handleChangeHidden}
            />
          </FormField>
          <FormField labelPlacement="left">
            <FormFieldLabel>Label</FormFieldLabel>
            <Input
              value={column.label ?? column.name}
              onChange={handleChangeLabel}
            />
          </FormField>
          <FormField labelPlacement="left">
            <FormFieldLabel>Width</FormFieldLabel>
            <StepperInput
              value={column.width ?? 100}
              onChange={handleChangeWidth}
            />
          </FormField>
          <FormField labelPlacement="left">
            <FormFieldLabel>Align</FormFieldLabel>
            <RadioButtonGroup
              aria-label="Column Align"
              value={column.align ?? "left"}
              onChange={handleChangeAlign}
            >
              <RadioButton label="Left" value="left" />
              <RadioButton label="Right" value="right" />
            </RadioButtonGroup>
          </FormField>
          <FormField labelPlacement="left">
            <FormFieldLabel>Pin Column</FormFieldLabel>
            <RadioButtonGroup
              aria-label="Pin Column"
              value={column.pin ?? ""}
              onChange={handleChangePin}
            >
              <RadioButton label="Do not pin" value={""} />
              <RadioButton label="Left" value="left" />
              <RadioButton label="Right" value="right" />
            </RadioButtonGroup>
          </FormField>
        </Panel>
        <ColumnTypePanel
          column={column}
          dispatchColumnAction={dispatchColumnAction}
          title="Data Cell"
        />
        <Panel title="Vuu" variant="secondary">
          <FormField labelPlacement="top" readOnly>
            <FormFieldLabel>Name</FormFieldLabel>
            <Input value={column.name} />
          </FormField>
          <FormField labelPlacement="top" readOnly>
            <FormFieldLabel>Vuu Type</FormFieldLabel>
            <Input value={column.serverDataType} />
          </FormField>
        </Panel>
      </Stack>
    </div>
  );
};
