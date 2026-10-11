import { ChromeIcon } from "../chrome/ChromeIcon";
import { ChromeSelect, type ChromeSelectOption } from "./ChromeSelect";
import type { DataLocation } from "./preview-state";

export const VUU_SERVER_URL = "wss://localhost:8090/websocket";

const options: ChromeSelectOption<DataLocation>[] = [
  {
    description: "In-browser simulator modules",
    icon: <ChromeIcon name="database" />,
    label: "Local simulator",
    value: "local",
  },
  {
    description: VUU_SERVER_URL,
    icon: <ChromeIcon name="plug" />,
    label: "Vuu server",
    value: "remote",
  },
];

export interface DataSourceSelectProps {
  onChange: (value: DataLocation) => void;
  value: DataLocation;
}

export const DataSourceSelect = ({ onChange, value }: DataSourceSelectProps) => (
  <ChromeSelect
    aria-label="Data source"
    onChange={onChange}
    options={options}
    value={value}
  />
);
