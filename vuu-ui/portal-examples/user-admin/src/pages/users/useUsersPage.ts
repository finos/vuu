import { useData } from "@vuu-ui/core";
import { useMemo } from "react";
import { USER_ADMIN_TABLES } from "../../data/user-admin-tables";
import {
  useApplicationScope,
  userScopeFilter,
} from "../../data/useApplicationScope";
import { USER_COLUMNS, usersTableConfig } from "./usersTable";

export const useUsersPage = () => {
  const { VuuDataSource } = useData();

  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: USER_COLUMNS,
        table: USER_ADMIN_TABLES.users,
      }),
    [VuuDataSource],
  );
  const { application, setApplication } = useApplicationScope(
    dataSource,
    userScopeFilter,
    { waitForModel: false },
  );

  const config = useMemo(() => usersTableConfig(), []);

  return {
    application,
    config,
    dataSource,
    setApplication,
  };
};
