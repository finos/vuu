import type { VuuTable } from "@vuu-ui/vuu-protocol-types";

export const USER_ADMIN_MODULE = "USER_ADMIN";

const table = (name: string): VuuTable => ({
  module: USER_ADMIN_MODULE,
  table: name,
});

export const USER_ADMIN_TABLES = {
  clients: table("clients"),
  groupRoles: table("group_roles"),
  groups: table("groups"),
  roles: table("roles"),
  users: table("users"),
} as const;
