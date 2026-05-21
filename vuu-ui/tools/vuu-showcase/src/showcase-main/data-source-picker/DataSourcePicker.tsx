import { ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import { SyntheticEvent, useCallback } from "react";
import { DataLocation } from "../ShowcaseProvider";
import { IconButton } from "@vuu-ui/vuu-ui-controls";

export interface DataSourcePickerProps {
  dataLocation: DataLocation;
  onDataLocationChange: (dataLocation: DataLocation) => void;
}

export const DataSourcePicker = ({
  dataLocation,
  onDataLocationChange,
}: DataSourcePickerProps) => {
  const handleDataLocationChange = useCallback(
    (evt: SyntheticEvent) => {
      const { value } = evt.target as HTMLInputElement;
      onDataLocationChange(value as DataLocation);
    },
    [onDataLocationChange],
  );

  return (
    <ToggleButtonGroup
      className="vuuToggleButtonGroup"
      data-variant="primary"
      onChange={handleDataLocationChange}
      value={dataLocation}
    >
      <ToggleButton value="local">Local Data</ToggleButton>
      <ToggleButton value="remote">Remote Data</ToggleButton>
      <IconButton icon="close" />
    </ToggleButtonGroup>
  );
};
