import { ColumnDescriptor, PinLocation } from "@finos/vuu-datagrid-types";
import { Stack } from "@finos/vuu-layout";
import {
  FormField,
  Input,
  Panel,
  RadioButton,
  RadioButtonGroup,
  StepperInput,
} from "@heswell/salt-lab";
import { Text } from "@salt-ds/core";
import cx from "classnames";
import {
  ChangeEvent,
  Dispatch,
  HTMLAttributes,
  useCallback,
  useState,
} from "react";
import { ColumnTypePanel } from "../column-type-panel";

import "./ColumnSettingsPanel.css";
import { ColumnAction } from "./useGridSettings";

const classBase = "vuuColumnSettingsPanel";

const tabstripProps = {
  className: "salt-density-high",
};

const NullActivationIndicator = () => null;

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
        Pick<ColumnDescriptor, "align" | "label" | "pin" | "width">
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

  const handleChangeLabel = useCallback(
    (evt: ChangeEvent, value: string) => dispatchUpdate({ label: value }),
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
          <FormField label="Label" labelPlacement="left">
            <Input
              value={column.label ?? column.name}
              onChange={handleChangeLabel}
            />
          </FormField>
          <FormField label="Width" labelPlacement="left">
            <StepperInput
              value={column.width ?? 100}
              onChange={handleChangeWidth}
            />
          </FormField>
          <FormField
            label="Align"
            labelPlacement="left"
            ActivationIndicatorComponent={NullActivationIndicator}
          >
            <RadioButtonGroup
              aria-label="Column Align"
              value={column.align ?? "left"}
              legend="Align"
              onChange={handleChangeAlign}
            >
              <RadioButton label="Left" value="left" />
              <RadioButton label="Right" value="right" />
            </RadioButtonGroup>
          </FormField>
          <FormField
            label="Pin Column"
            labelPlacement="left"
            ActivationIndicatorComponent={NullActivationIndicator}
          >
            <RadioButtonGroup
              aria-label="Pin Column"
              value={column.pin ?? ""}
              legend="Pin Column"
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
          <FormField
            label="Name"
            labelPlacement="top"
            readOnly
            variant="secondary"
          >
            <Input value={column.name} />
          </FormField>
          <FormField
            label="Vuu type"
            labelPlacement="top"
            readOnly
            variant="secondary"
          >
            <Input value={column.serverDataType} />
          </FormField>
        </Panel>
      </Stack>
    </div>
  );
};
