import { ChangeEvent, useEffect, useState } from "react";
import { Input, Button, FormField, FormFieldLabel, Text } from "@salt-ds/core";
import { ComboBox, Checkbox, RadioButton } from "@finos/vuu-ui-controls";
import { formatDate, takeScreenshot } from "@finos/vuu-utils";
import { LayoutMetadata } from "./layoutTypes";

import "./SaveLayoutPanel.css";

const groups = [
  "Group 1",
  "Group 2",
  "Group 3",
  "Group 4",
  "Group 5"
];

const checkboxValues = [
  "Value 1",
  "Value 2",
  "Value 3"
];

const radioValues = [
  "Value 1",
  "Value 2",
  "Value 3"
] as const;

type RadioValue = typeof radioValues[number] | undefined;

type SaveLayoutPanelProps = {
  onCancel: () => void;
  onSave: (layoutMetadata: Omit<LayoutMetadata, "id">) => void;
};

export const SaveLayoutPanel = (props: SaveLayoutPanelProps) => {
  const { onCancel, onSave } = props;

  const [layoutName, setLayoutName] = useState<string>("");
  const [group, setGroup] = useState<string>("");
  const [checkValues, setCheckValues] = useState<string[]>([]);
  const [radioValue, setRadioValue] = useState<RadioValue>(radioValues[0]);
  const [screenshot, setScreenshot] = useState<string | undefined>();

  useEffect(() => {
    takeScreenshot(document.getElementsByClassName("vuuShell-content")[0] as HTMLElement).then(screenshot =>
      setScreenshot(screenshot)
    )
  }, [])

  const handleSubmit = () => {
    onSave({
      name: layoutName,
      group,
      screenshot: screenshot ?? "",
      user: "User",
      date: formatDate(new Date(), "dd.mm.yyyy")
    })
  }

  return (
    <div className="panelContainer">
      <div className="panelContent">
        <div className="formContainer">
          <FormField>
            <FormFieldLabel>Group</FormFieldLabel>
            <ComboBox
              ListProps={{
                style: {
                  zIndex: 10000,
                  border: "1px solid #777C94",
                  borderRadius: 10,
                  boxSizing: "border-box"
                }
              }}
              source={groups}
              allowFreeText={true}
              InputProps={{
                inputProps: {
                  placeholder: "Select Group or Enter New Name",
                  onChange: (event: ChangeEvent<HTMLInputElement>) => setGroup(event.target.value),
                },
              }}
              width={120}
              onSelectionChange={(_, value) => setGroup(value || "")}
            />
          </FormField>
          <FormField>
            <FormFieldLabel>Layout Name</FormFieldLabel>
            <Input
              inputProps={{ placeholder: "Enter Layout Name" }}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setLayoutName(event.target.value)}
              value={layoutName}
            />
          </FormField>
          <FormField>
            <FormFieldLabel>Some Layout Setting</FormFieldLabel>
            <div className="settingsGroup">
              {checkboxValues.map((value, i) =>
                <Checkbox
                  key={i}
                  className="setting"
                  onToggle={() => setCheckValues((prev) => prev.includes(value) ? prev.filter(entry => entry !== value) : [...prev, value])}
                  checked={checkValues.includes(value)}
                  label={value}
                />
              )}
            </div>
          </FormField>
          <FormField>
            <FormFieldLabel>Some Layout Setting</FormFieldLabel>
            <div className="settingsGroup">
              {radioValues.map((value, i) =>
                <RadioButton
                  key={i}
                  onClick={() => setRadioValue(value)}
                  checked={radioValue === value}
                  label={value}
                  groupName="radioGroup"
                />
              )}
            </div>
          </FormField>
        </div>
        <div className="screenshotContainer">
          {screenshot ? (
            <img
              className="screenshot"
              src={screenshot}
              alt="screenshot of current layout"
            />
          ) : (
            <Text className="screenshot">No screenshot available</Text>
          )}
        </div>
      </div>
      <div className="buttonsContainer">
        <Button
          className="cancelButton"
          onClick={onCancel}
        >Cancel
        </Button>
        <Button
          className="saveButton"
          onClick={handleSubmit}
          disabled={layoutName === "" || group === ""}
        >Save
        </Button>
      </div>
    </div>
  );
};
