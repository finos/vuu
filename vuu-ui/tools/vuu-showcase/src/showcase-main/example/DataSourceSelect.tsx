import { useEffect, useMemo } from "react";
import { ChromeIcon } from "../chrome/ChromeIcon";
import { ChromeSelect, type ChromeSelectOption } from "./ChromeSelect";
import type { DataLocation } from "./preview-state";
import { type ServerStatus, useServerProbe } from "./useServerProbe";

export const VUU_SERVER_URL = "wss://localhost:8090/websocket";

const statusLabel: Record<ServerStatus, string> = {
  checking: "Checking server",
  reachable: "Server reachable",
  unknown: "Server status unknown",
  unreachable: "Server not reachable",
};

const StatusDot = ({ status }: { status: ServerStatus }) => (
  <span
    aria-label={statusLabel[status]}
    className="ShowcaseStatusDot"
    data-status={
      status === "reachable"
        ? "ok"
        : status === "unreachable"
          ? "warn"
          : undefined
    }
    role="img"
    title={statusLabel[status]}
  />
);

export interface DataSourceSelectProps {
  onChange: (value: DataLocation) => void;
  value: DataLocation;
}

export const DataSourceSelect = ({
  onChange,
  value,
}: DataSourceSelectProps) => {
  const { probe, status } = useServerProbe(VUU_SERVER_URL);

  useEffect(() => {
    // the selected server should report its status without opening the menu
    if (value === "remote") {
      probe();
    }
  }, [probe, value]);

  const options = useMemo<ChromeSelectOption<DataLocation>[]>(
    () => [
      {
        adornment: <span className="ShowcaseStatusDot" data-status="ok" />,
        description: "In-browser simulator modules",
        icon: <ChromeIcon name="database" />,
        label: "Local simulator",
        value: "local",
      },
      {
        adornment: <StatusDot status={status} />,
        description:
          status === "unreachable"
            ? "Not reachable · start a Vuu server on localhost:8090"
            : status === "checking"
              ? "Checking server…"
              : VUU_SERVER_URL,
        icon: <ChromeIcon name="plug" />,
        label: "Vuu server",
        value: "remote",
      },
    ],
    [status],
  );

  return (
    <ChromeSelect
      aria-label="Data source"
      onChange={onChange}
      onOpenChange={(open) => open && probe()}
      options={options}
      value={value}
    />
  );
};
