import {
  ConfigurationEditorProps,
  registerConfigurationEditor,
} from "@finos/vuu-utils";
import { FormField, FormFieldLabel } from "@salt-ds/core";
import { Dropdown, SingleSelectionHandler } from "@finos/vuu-ui-controls";

import "./BackgroundCellConfigurationEditor.css";
import { useCallback, useState } from "react";
import { ColumnDescriptorCustomRenderer } from "packages/vuu-datagrid-types";

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
  const [flashStyle, setFlashStyle] = useState<FlashOption | null>(
    valueFromColumn(column)
  );
  const handleSelectionChange = useCallback<
    SingleSelectionHandler<FlashOption>
  >(
    (_, flashOption) => {
      setFlashStyle(flashOption);
      const renderProps = column.type.renderer;
      onChangeRendering({
        ...renderProps,
        flashStyle: flashOption?.value ?? defaultFlashOption.value,
      });
    },
    [column.type, onChangeRendering]
  );

  return (
    <FormField>
      <FormFieldLabel>Flash Style</FormFieldLabel>
      <Dropdown<FlashOption>
        className={`${classBase}-flashStyle`}
        onSelectionChange={handleSelectionChange}
        selected={flashStyle}
        source={flashOptions}
        width="100%"
      />
    </FormField>
  );
};

registerConfigurationEditor(
  "BackgroundCellConfigurationEditor",
  BackgroundCellConfigurationEditor
);
