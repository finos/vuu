import { ChangeEvent, useEffect, useState } from "react";
import { Input, Button, FormField, FormFieldLabel, Text } from "@salt-ds/core";
import { ComboBox, Checkbox, RadioButton } from "@finos/vuu-ui-controls";
import { formatDate, takeScreenshot } from "@finos/vuu-utils";
import { LayoutMetadata } from "./layoutTypes";

import "./SaveLayoutPanel.css";

const classBase = "saveLayoutPanel";
const formField = `${classBase}-formField`;

const groups = ["Group 1", "Group 2", "Group 3", "Group 4", "Group 5"];

const checkboxValues = ["Value 1", "Value 2", "Value 3"];

const radioValues = ["Value 1", "Value 2", "Value 3"] as const;

type RadioValue = (typeof radioValues)[number];

type SaveLayoutPanelProps = {
  onCancel: () => void;
  onSave: (layoutMetadata: Omit<LayoutMetadata, "id">) => void;
  componentId?: string;
};

export const SaveLayoutPanel = (props: SaveLayoutPanelProps) => {
  const { onCancel, onSave, componentId } = props;

  const [layoutName, setLayoutName] = useState<string>("");
  const [group, setGroup] = useState<string>("");
  const [checkValues, setCheckValues] = useState<string[]>([]);
  const [radioValue, setRadioValue] = useState<RadioValue>(radioValues[0]);
  const [screenshot, setScreenshot] = useState<string | undefined>();

  useEffect(() => {
    if (componentId) {
      takeScreenshot(document.getElementById(componentId) as HTMLElement).then(
        (screenshot) => setScreenshot(screenshot)
      );
    }
  }, [componentId]);

  const handleSubmit = () => {
    onSave({
      name: layoutName,
      group,
      screenshot: screenshot ?? "",
      user: "User",
      date: formatDate(new Date(), "dd.mm.yyyy"),
    });
  };

  return (
    <div className={`${classBase}-panelContainer`}>
      <div className={`${classBase}-panelContent`}>
        <div className={`${classBase}-formContainer`}>
          <FormField className={formField}>
            <FormFieldLabel>Group</FormFieldLabel>
            <ComboBox
              source={groups}
              allowFreeText
              InputProps={{
                inputProps: {
                  className: `${classBase}-inputText`,
                  placeholder: "Select Group or Enter New Name",
                  onChange: (event: ChangeEvent<HTMLInputElement>) =>
                    setGroup(event.target.value),
                },
              }}
              width="100%"
              onSelectionChange={(_, value) => setGroup(value || "")}
            />
          </FormField>
          <FormField className={formField}>
            <FormFieldLabel>Layout Name</FormFieldLabel>
            <Input
              inputProps={{
                className: `${classBase}-inputText`,
                placeholder: "Enter Layout Name",
              }}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setLayoutName(event.target.value)
              }
              value={layoutName}
            />
          </FormField>
          <FormField className={formField}>
            <FormFieldLabel>Some Layout Setting</FormFieldLabel>
            <div className={`${classBase}-settingsGroup`}>
              {checkboxValues.map((value, i) => (
                <Checkbox
                  key={i}
                  onToggle={() =>
                    setCheckValues((prev) =>
                      prev.includes(value)
                        ? prev.filter((entry) => entry !== value)
                        : [...prev, value]
                    )
                  }
                  checked={checkValues.includes(value)}
                  label={value}
                />
              ))}
            </div>
          </FormField>
          <FormField className={formField}>
            <FormFieldLabel>Some Layout Setting</FormFieldLabel>
            <div className={`${classBase}-settingsGroup`}>
              {radioValues.map((value, i) => (
                <RadioButton
                  key={i}
                  onClick={() => setRadioValue(value)}
                  checked={radioValue === value}
                  label={value}
                  groupName="radioGroup"
                />
              ))}
            </div>
          </FormField>
        </div>
        <div className={`${classBase}-screenshotContainer`}>
          {screenshot ? (
            <img
              className={`${classBase}-screenshot`}
              src={screenshot}
              alt="screenshot of current layout"
            />
          ) : (
            <Text className="screenshot">No screenshot available</Text>
          )}
        </div>
      </div>
      <div className={`${classBase}-buttonsContainer`}>
        <Button className={`${classBase}-cancelButton`} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className={`${classBase}-saveButton`}
          onClick={handleSubmit}
          disabled={layoutName === "" || group === ""}
        >
          Save
        </Button>
      </div>
    </div>
  );
};
