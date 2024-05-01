import { Checkbox, ComboBox, RadioButton } from "@finos/vuu-ui-controls";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { takeScreenshot } from "./screenshot-utils";
import { Button, FormField, FormFieldLabel, Input, Text } from "@salt-ds/core";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { LayoutMetadataDto } from "./layoutTypes";
import { getAuthDetailsFromCookies } from "../login";

import saveLayoutPanelCss from "./SaveLayoutPanel.css";

const classBase = "saveLayoutPanel";
const formField = `${classBase}-formField`;

const groups = ["Group 1", "Group 2", "Group 3", "Group 4", "Group 5"];

const checkboxValues = ["Value 1", "Value 2", "Value 3"];

const radioValues = ["Value 1", "Value 2", "Value 3"] as const;

type RadioValue = (typeof radioValues)[number];

type SaveLayoutPanelProps = {
  componentId?: string;
  defaultTitle?: string;
  onCancel: () => void;
  onSave: (layoutMetadata: LayoutMetadataDto) => void;
};

export const SaveLayoutPanel = (props: SaveLayoutPanelProps) => {
  const { defaultTitle = "", onCancel, onSave, componentId } = props;

  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-save-layout-panel",
    css: saveLayoutPanelCss,
    window: targetWindow,
  });

  const [layoutName, setLayoutName] = useState<string>(defaultTitle);
  const [group, setGroup] = useState<string>("");
  const [checkValues, setCheckValues] = useState<string[]>([]);
  const [radioValue, setRadioValue] = useState<RadioValue>(radioValues[0]);
  const [screenshot, setScreenshot] = useState<string | undefined>();
  const [screenshotErrorMessage, setScreenshotErrorMessage] = useState<
    string | undefined
  >();
  const [username] = getAuthDetailsFromCookies();

  useEffect(() => {
    if (componentId) {
      takeScreenshot(document.getElementById(componentId) as HTMLElement)
        .then((screenshot) => {
          setScreenshot(screenshot);
        })
        .catch((error: Error) => {
          setScreenshotErrorMessage(error.message);
        });
    }
  }, [componentId]);

  const handleSubmit = () => {
    onSave({
      name: layoutName,
      group,
      screenshot: screenshot ?? "",
      user: username,
    });
  };

  const screenshotContent = useMemo(() => {
    if (screenshot) {
      return (
        <img
          className={`${classBase}-screenshot`}
          src={screenshot}
          alt="screenshot of current layout"
        />
      );
    }
    if (screenshotErrorMessage) {
      return <Text>{screenshotErrorMessage}</Text>;
    }
    return <div className="spinner" />;
  }, [screenshot, screenshotErrorMessage]);

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
          {screenshotContent}
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
