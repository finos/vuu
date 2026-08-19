import type { ManagedModule } from "@heswell/module-admin/contracts";
import { useData } from "@vuu-ui/core";
import { useMemo } from "react";
import {
  MODULE_COLUMNS,
  MODULE_PERMISSION_COLUMNS,
  MODULE_PERMISSIONS_TABLE,
  MODULES_TABLE,
} from "./module-admin-tables";
import {
  createModuleAdminClient,
  type ModuleAdminClient,
} from "./module-admin-rpc";
import { toManagedModules } from "./module-model";
import { useTableRows } from "./useTableRows";

export interface ModuleAdminData {
  client: ModuleAdminClient;
  error?: string;
  loading: boolean;
  modules: ManagedModule[];
}

/** Live modules from module discovery, with their access roles. */
export const useModuleAdminData = (): ModuleAdminData => {
  const { VuuDataSource } = useData();
  const modulesSource = useMemo(
    () =>
      new VuuDataSource({
        bufferSize: 0,
        columns: [...MODULE_COLUMNS],
        table: MODULES_TABLE,
      }),
    [VuuDataSource],
  );
  const permissionsSource = useMemo(
    () =>
      new VuuDataSource({
        bufferSize: 0,
        columns: [...MODULE_PERMISSION_COLUMNS],
        table: MODULE_PERMISSIONS_TABLE,
      }),
    [VuuDataSource],
  );
  const modules = useTableRows(modulesSource, MODULE_COLUMNS);
  const permissions = useTableRows(
    permissionsSource,
    MODULE_PERMISSION_COLUMNS,
  );
  const client = useMemo(
    () => createModuleAdminClient(modulesSource),
    [modulesSource],
  );
  const managedModules = useMemo(
    () => toManagedModules(modules.rows, permissions.rows),
    [modules.rows, permissions.rows],
  );

  return {
    client,
    error: modules.error ?? permissions.error,
    loading: modules.loading || permissions.loading,
    modules: managedModules,
  };
};
