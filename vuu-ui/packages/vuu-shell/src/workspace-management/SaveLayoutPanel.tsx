import { LayoutMetadataDto } from "@vuu-ui/vuu-utils";
import {
  Button,
  ComboBox,
  FormField,
  FormFieldLabel,
  Input,
  Option,
  Text,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  ChangeEvent,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { takeScreenshot } from "./screenshot-utils";

import saveLayoutPanelCss from "./SaveLayoutPanel.css";
import { useApplicationUser } from "../application-provider";

const classBase = "vuuSaveLayoutPanel";

const groups = ["Group 1", "Group 2", "Group 3", "Group 4", "Group 5"];

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
  const [screenshot, setScreenshot] = useState<string | undefined>();
  const [screenshotErrorMessage, setScreenshotErrorMessage] = useState<
    string | undefined
  >();
  const { username } = useApplicationUser();

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

  const handleSelectionChange = useCallback(
    (e: SyntheticEvent | KeyboardEvent, [selectedValue]: string[]) => {
      if (
        (e as KeyboardEvent).key === "Tab" &&
        !selectedValue.toLowerCase().startsWith(group.toLowerCase())
      ) {
        // ignore. The ComboBox forces selection of a value from the list on Tab
      } else {
        setGroup(selectedValue || "");
      }
    },
    [group],
  );

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setGroup(e.target.value);
  }, []);

  return (
    <div className={`${classBase}`}>
      <div className={`${classBase}-panelContent`}>
        <FormField>
          <FormFieldLabel>Group</FormFieldLabel>
          <ComboBox
            data-embedded
            inputProps={{
              autoComplete: "off",
              className: `${classBase}-inputText`,
              placeholder: "Select Group or Enter New Name",
              // onChange: (event: ChangeEvent<HTMLInputElement>) =>
              //   setGroup(event.target.value),
            }}
            onChange={handleChange}
            onSelectionChange={handleSelectionChange}
            value={group}
          >
            {groups.map((group, i) => (
              <Option key={i} value={group} />
            ))}
          </ComboBox>
        </FormField>
        <FormField>
          <FormFieldLabel>Layout Name</FormFieldLabel>
          <Input
            data-embedded
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
        <div className={`${classBase}-screenshotContainer`}>
          {screenshotContent}
        </div>
      </div>
      <div className={`${classBase}-buttonsContainer`}>
        <Button className={`${classBase}-cancelButton`} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          appearance="solid"
          className={`${classBase}-saveButton`}
          onClick={handleSubmit}
          disabled={layoutName === "" || group === ""}
          sentiment="accented"
        >
          Save
        </Button>
      </div>
    </div>
  );
};
