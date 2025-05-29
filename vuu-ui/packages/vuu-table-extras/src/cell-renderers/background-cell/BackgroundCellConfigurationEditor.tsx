import type { ColumnDescriptorCustomRenderer } from "@vuu-ui/vuu-table-types";
import {
  ConfigurationEditorProps,
  registerConfigurationEditor,
} from "@vuu-ui/vuu-utils";
import { Dropdown, FormField, FormFieldLabel, Option } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { SyntheticEvent, useCallback, useState } from "react";

import backgroundCellConfigurationEditorCss from "./BackgroundCellConfigurationEditor.css";

const classBase = "vuuBackgroundCellConfiguration";

type FlashOption = {
  label: string;
  value: "arrow" | "bg-only" | "arrow-bg";
};

const flashOptions: FlashOption[] = [
  { label: "Background Only", value: "bg-only" },
  { label: "Background and Arrow", value: "arrow-bg" },
  { label: "Arrow Only", value: "arrow" },
];

const [defaultFlashOption] = flashOptions;

const valueFromColumn = (column: ColumnDescriptorCustomRenderer) => {
  const { flashStyle } = column.type.renderer;
  return flashOptions.find((o) => o.value === flashStyle) || defaultFlashOption;
};

export const BackgroundCellConfigurationEditor = ({
  column,
  onChangeRendering,
}: ConfigurationEditorProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-background-cell-configuration-editor",
    css: backgroundCellConfigurationEditorCss,
    window: targetWindow,
  });

  console.log({ type: column.type });

  const [flashStyle, setFlashStyle] = useState<FlashOption | undefined>(
    valueFromColumn(column),
  );
  const handleSelectionChange = useCallback(
    (_: SyntheticEvent, [flashOption]: FlashOption[]) => {
      setFlashStyle(flashOption);
      const renderProps = column.type.renderer;
      onChangeRendering({
        ...renderProps,
        flashStyle: flashOption?.value ?? defaultFlashOption.value,
      });
    },
    [column.type, onChangeRendering],
  );

  return (
    <FormField>
      <FormFieldLabel>Flash Style</FormFieldLabel>
      <Dropdown<FlashOption>
        className={`${classBase}-flashStyle`}
        onSelectionChange={handleSelectionChange}
        selected={flashStyle ? [flashStyle] : []}
        value={flashStyle?.label}
      >
        {flashOptions.map((flashOption, i) => (
          <Option key={i} value={flashOption}>
            {flashOption.label}
          </Option>
        ))}
      </Dropdown>
    </FormField>
  );
};

registerConfigurationEditor(
  "BackgroundCellConfigurationEditor",
  BackgroundCellConfigurationEditor,
);
