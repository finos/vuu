import { useData } from "@vuu-ui/core";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { useMemo } from "react";
import { MODULE_ACCESS_CELL_RENDERER } from "../../components/ModuleAccessCell";
import { USER_ADMIN_TABLES } from "../../data/user-admin-tables";
import {
  useApplicationScope,
  userScopeFilter,
} from "../../data/useApplicationScope";

export const useUsersPage = () => {
  const { VuuDataSource } = useData();

  const dataSource = useMemo(() => {
    return new VuuDataSource({
      columns: [
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
      ],
      table: USER_ADMIN_TABLES.users,
    });
  }, [VuuDataSource]);
  const { application, setApplication } = useApplicationScope(
    dataSource,
    userScopeFilter,
    { waitForModel: false },
  );

  const config = useMemo<TableConfig>(() => {
    return {
      columns: [
        { name: "user_id", label: "", hidden: true },
        { name: "username", label: "UserName" },
        { name: "email", label: "Email" },
        { name: "first_name", label: "First Name" },
        { name: "last_name", label: "Last Name" },
        { name: "enabled", label: "Enabled" },
        { name: "email_verified", label: "Email verified" },
        { name: "password_update_required", label: "Password update required" },
        { name: "last_login", label: "Last Login" },
        { name: "group_count", label: "Groups" },
        { name: "role_count", label: "Roles" },
        {
          name: "module_access",
          label: "Applications",
          type: {
            name: "string",
            renderer: { name: MODULE_ACCESS_CELL_RENDERER },
          },
          width: 240,
        },
        { name: "module_access_count", label: "Application count" },
      ],
      columnSeparators: true,
      zebraStripes: true,
    };
  }, []);

  return {
    application,
    config,
    dataSource,
    setApplication,
  };
};
