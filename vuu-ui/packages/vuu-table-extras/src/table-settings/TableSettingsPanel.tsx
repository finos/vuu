import { useMemo } from "react";
import { Dropdown, SingleSelectionHandler } from "@finos/vuu-ui-controls";
import {
  Button,
  FormField,
  FormFieldLabel,
  Input,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import {
  localeOptions,
  timeZoneOptions,
  getDefaultLocaleAndTimeZone,
} from "@finos/vuu-utils";
import {
  DateTimeTableAttributes,
  TableSettingsProps,
} from "@finos/vuu-table-types";
import { ColumnList } from "../column-list";
import { useTableSettings } from "./useTableSettings";

import "./TableSettingsPanel.css";

const classBase = "vuuTableSettingsPanel";

/**
  The TableSettingsPanel assumes 'ownership' of the tableSettings.
  It updates the settings in state locally and notifies caller of
  every change via onChange callback
 */
export const TableSettingsPanel = ({
  availableColumns,
  onAddCalculatedColumn,
  onConfigChange,
  onDataSourceConfigChange,
  onNavigateToColumn,
  tableConfig: tableConfigProp,
}: TableSettingsProps) => {
  const {
    columnItems,
    columnLabelsValue,
    onChangeColumnLabels,
    onChangeTableAttribute,
    onColumnChange,
    onChangeDateTimeAttribute,
    onMoveListItem,
    tableConfig,
  } = useTableSettings({
    availableColumns,
    onConfigChange,
    onDataSourceConfigChange,
    tableConfig: tableConfigProp,
  });

  return (
    <div className={classBase}>
      <FormField>
        <FormFieldLabel>Column Labels</FormFieldLabel>
        <ToggleButtonGroup
          className="vuuToggleButtonGroup"
          onChange={onChangeColumnLabels}
          value={columnLabelsValue}
        >
          <ToggleButton
            className="vuuIconToggleButton"
            data-icon="text-strikethrough"
            value={0}
          />
          <ToggleButton
            className="vuuIconToggleButton"
            data-icon="text-Tt"
            value={1}
          />
          <ToggleButton
            className="vuuIconToggleButton"
            data-icon="text-T"
            value={2}
          />
        </ToggleButtonGroup>
      </FormField>

      <FormField>
        <FormFieldLabel>Grid separators</FormFieldLabel>
        <div className="saltToggleButtonGroup vuuToggleButtonGroup saltToggleButtonGroup-horizontal vuuGridSeparators">
          <ToggleButton
            className="vuuIconToggleButton"
            data-icon="row-striping"
            selected={tableConfig.zebraStripes ?? false}
            onChange={onChangeTableAttribute}
            value="zebraStripes"
          />
          <ToggleButton
            className="vuuIconToggleButton"
            data-icon="row-lines"
            selected={tableConfig.rowSeparators ?? false}
            onChange={onChangeTableAttribute}
            value="rowSeparators"
          />
          <ToggleButton
            className="vuuIconToggleButton"
            data-icon="col-lines"
            selected={tableConfig.columnSeparators ?? false}
            onChange={onChangeTableAttribute}
            value="columnSeparators"
          />
        </div>
      </FormField>

      <FormField>
        <FormFieldLabel>Default Column Width</FormFieldLabel>
        <Input className="vuuInput" />
      </FormField>

      <DateTimeAttributesSettings
        dateTimeAttrs={tableConfig.dateTime ?? {}}
        onLocaleChange={onChangeDateTimeAttribute("locale")}
        onTimeZoneChange={onChangeDateTimeAttribute("timeZone")}
      />

      <ColumnList
        columnItems={columnItems}
        onChange={onColumnChange}
        onMoveListItem={onMoveListItem}
        onNavigateToColumn={onNavigateToColumn}
      />

      <div className={`${classBase}-calculatedButtonbar`}>
        <Button data-icon="plus" onClick={onAddCalculatedColumn} />
        <span className={`${classBase}-calculatedLabel`}>
          Add calculated column
        </span>
      </div>
    </div>
  );
};

const DateTimeAttributesSettings: React.FC<{
  dateTimeAttrs: DateTimeTableAttributes;
  onLocaleChange: SingleSelectionHandler<string>;
  onTimeZoneChange: SingleSelectionHandler<string>;
}> = ({ dateTimeAttrs, onLocaleChange, onTimeZoneChange }) => {
  const { locale: defaultLocale, timeZone: defaultTimeZone } =
    getDefaultLocaleAndTimeZone();
  const { locale = defaultLocale, timeZone = defaultTimeZone } = dateTimeAttrs;

  const localesSource = useMemo(
    () => [...new Set([...localeOptions, locale, defaultLocale])].sort(),
    [locale, defaultLocale]
  );

  const timeZonesSource = useMemo(
    () => [...new Set([...timeZoneOptions, timeZone, defaultTimeZone])].sort(),
    [timeZone, defaultTimeZone]
  );

  return (
    <>
      <FormField>
        <FormFieldLabel>Date/time locale</FormFieldLabel>
        <Dropdown
          onSelectionChange={onLocaleChange}
          selected={locale}
          source={localesSource}
          width="100%"
        />
      </FormField>

      <FormField>
        <FormFieldLabel>Time-zone</FormFieldLabel>
        <Dropdown
          onSelectionChange={onTimeZoneChange}
          selected={timeZone}
          source={timeZonesSource}
          width="100%"
        />
      </FormField>
    </>
  );
};
