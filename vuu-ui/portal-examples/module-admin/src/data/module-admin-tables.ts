import type { VuuTable } from "@vuu-ui/vuu-protocol-types";

export const MODULE_DISCOVERY = "MODULE_DISCOVERY";

export const MODULES_TABLE: VuuTable = {
  module: MODULE_DISCOVERY,
  table: "modules",
};

export const MODULE_PERMISSIONS_TABLE: VuuTable = {
  module: MODULE_DISCOVERY,
  table: "modulePermissions",
};

export const MODULE_COLUMNS = [
  "id",
  "parentModuleId",
  "name",
  "title",
  "description",
  "version",
  "enabled",
  "location",
  "path",
  "mfComponent",
  "mfScope",
  "mfUrl",
  "navIconUrl",
  "vuuCreatedTimestamp",
  "vuuUpdatedTimestamp",
] as const;

export const MODULE_PERMISSION_COLUMNS = ["id", "module_id", "role"] as const;
