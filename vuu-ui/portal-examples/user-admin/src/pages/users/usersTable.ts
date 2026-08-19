import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { MODULE_ACCESS_CELL_RENDERER } from "../../components/ModuleAccessCell";
import {
  USER_IDENTITY_CELL_RENDERER,
  USER_LAST_LOGIN_CELL_RENDERER,
  USER_STATUS_CELL_RENDERER,
} from "../../components/UserCells";

/** Columns the user tables subscribe to; most are shown inside other cells. */
export const USER_COLUMNS = [
  "user_id",
  "username",
  "email",
  "first_name",
  "last_name",
  "enabled",
  "email_verified",
  "password_update_required",
  "last_login",
  "group_count",
  "role_count",
  "module_access",
  "module_access_count",
];

export const USER_ROW_HEIGHT = 52;

export const usersTableConfig = ({
  compact = false,
}: {
  compact?: boolean;
} = {}): TableConfig => ({
  columns: [
    {
      name: "username",
      label: "User",
      type: {
        name: "string",
        renderer: { name: USER_IDENTITY_CELL_RENDERER },
      },
      minWidth: 180,
      maxWidth: 480,
      width: 300,
    },
    {
      name: "module_access",
      label: "Applications",
      type: {
        name: "string",
        renderer: { name: MODULE_ACCESS_CELL_RENDERER },
      },
      minWidth: 150,
      maxWidth: 480,
      width: 280,
    },
    { name: "group_count", label: "Groups", minWidth: 70, width: 90 },
    {
      name: "enabled",
      label: "Status",
      type: {
        name: "boolean",
        renderer: { name: USER_STATUS_CELL_RENDERER },
      },
      minWidth: 100,
      width: 120,
    },
    {
      hidden: compact,
      name: "last_login",
      label: "Last login",
      align: "left",
      minWidth: 100,
      type: {
        name: "number",
        renderer: { name: USER_LAST_LOGIN_CELL_RENDERER },
      },
      width: 180,
    },
    {
      hidden: compact,
      name: "role_count",
      label: "Roles",
      minWidth: 60,
      width: 80,
    },
    { hidden: true, name: "user_id", label: "" },
    { hidden: true, name: "email", label: "Email" },
    { hidden: true, name: "first_name", label: "First name" },
    { hidden: true, name: "last_name", label: "Last name" },
    { hidden: true, name: "email_verified", label: "Email verified" },
    {
      hidden: true,
      name: "password_update_required",
      label: "Password update required",
    },
    { hidden: true, name: "module_access_count", label: "Application count" },
  ],
  columnLayout: "fit",
  columnSeparators: false,
  rowSeparators: true,
  zebraStripes: false,
});
