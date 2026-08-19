import { Avatar, Text } from "@salt-ds/core";
import type { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { registerComponent } from "@vuu-ui/vuu-utils";
import { StatusText } from "./admin-ui/AdminUi";

export const USER_IDENTITY_CELL_RENDERER = "vuu-admin-user-identity";
export const USER_STATUS_CELL_RENDERER = "vuu-admin-user-status";
export const USER_LAST_LOGIN_CELL_RENDERER = "vuu-admin-user-last-login";

const text = (value: unknown) => (typeof value === "string" ? value : "");

/** "First Last", falling back to the username. */
export const userDisplayName = (row: Record<string, unknown>) =>
  [text(row.first_name), text(row.last_name)].filter(Boolean).join(" ") ||
  text(row.username);

/** Avatar, display name, and username · email. */
export const UserIdentityCell = ({ dataRow }: TableCellRendererProps) => {
  const name = userDisplayName(dataRow);
  const details = [text(dataRow.username), text(dataRow.email)]
    .filter(Boolean)
    .join(" · ");
  return (
    <span className="vuuIdentityAdmin-cell">
      <Avatar aria-hidden name={name} size={1} />
      <span className="vuuAdminUi-stack">
        <strong>{name}</strong>
        <Text color="secondary" styleAs="label">
          {details}
        </Text>
      </span>
    </span>
  );
};

export const UserStatusCell = ({ column, dataRow }: TableCellRendererProps) =>
  dataRow[column.name] === false ? (
    <StatusText status="error">Disabled</StatusText>
  ) : (
    <StatusText status="success">Enabled</StatusText>
  );

const lastLoginFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

/** A last-login timestamp (epoch millis); 0 means the user has never logged in. */
export const UserLastLoginCell = ({
  column,
  dataRow,
}: TableCellRendererProps) => {
  const value = Number(dataRow[column.name]);
  return Number.isFinite(value) && value > 0 ? (
    <span>{lastLoginFormat.format(value)}</span>
  ) : (
    <Text color="secondary">Never</Text>
  );
};

registerComponent(
  USER_IDENTITY_CELL_RENDERER,
  UserIdentityCell,
  "cell-renderer",
  { serverDataType: "string", userCanAssign: false },
);
registerComponent(USER_STATUS_CELL_RENDERER, UserStatusCell, "cell-renderer", {
  serverDataType: "boolean",
  userCanAssign: false,
});
registerComponent(
  USER_LAST_LOGIN_CELL_RENDERER,
  UserLastLoginCell,
  "cell-renderer",
  { serverDataType: ["long", "int"], userCanAssign: false },
);
