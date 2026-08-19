import { StatusIndicator, Tag, Text } from "@salt-ds/core";
import type { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { registerComponent } from "@vuu-ui/vuu-utils";
import type { FC } from "react";
import {
  applicationForGroupName,
  classifyRole,
  groupNameFromPath,
  type PortalApplication,
} from "../data/applications";
import {
  useApplicationModel,
  useApplications,
} from "../data/useApplicationModel";
import {
  AccessTag,
  AppAvatar,
  GroupName,
  RoleName,
  useApplicationCategory,
} from "./admin-ui/AdminUi";

import "./ApplicationCell.css";

export const GROUP_APPLICATION_CELL_RENDERER = "vuu-admin-group-application";
export const GROUP_NAME_CELL_RENDERER = "vuu-admin-group-name";
export const GROUP_ROLES_CELL_RENDERER = "vuu-admin-group-roles";
export const ROLE_APPLICATION_CELL_RENDERER = "vuu-admin-role-application";
export const ROLE_NAME_CELL_RENDERER = "vuu-admin-role-name";
export const ROLE_TYPE_CELL_RENDERER = "vuu-admin-role-type";

const classBase = "vuuAdminApplicationCell";

const Unassigned = () => (
  <span className={classBase}>
    <StatusIndicator status="warning" />
    <span className={`${classBase}-unassigned`}>Unassigned</span>
  </span>
);

const ApplicationLabel = ({
  application,
}: {
  application?: PortalApplication;
}) =>
  application ? (
    <span className={classBase}>
      <AppAvatar application={application} size={0.9} />
      <span className={`${classBase}-title`}>{application.title}</span>
    </span>
  ) : (
    <Unassigned />
  );

const useGroupApplication = (dataRow: TableCellRendererProps["dataRow"]) => {
  const { applications } = useApplications();
  const groupName = groupNameFromPath(dataRow.group_path);
  return {
    application: applicationForGroupName(applications, groupName),
    groupName,
  };
};

const useRoleClassification = (dataRow: TableCellRendererProps["dataRow"]) => {
  const { applications } = useApplications();
  return classifyRole(
    applications,
    dataRow.role_name,
    dataRow.client_identifier,
  );
};

/**
 * Renders the application a group belongs to, derived from `group_path`
 * whichever column it is attached to.
 */
export const GroupApplicationCell = ({ dataRow }: TableCellRendererProps) => (
  <ApplicationLabel application={useGroupApplication(dataRow).application} />
);

/** The group name, with the application prefix de-emphasised. */
export const GroupNameCell = ({ column, dataRow }: TableCellRendererProps) => {
  const { application, groupName } = useGroupApplication(dataRow);
  const value = dataRow[column.name];
  return (
    <GroupName
      name={groupName ?? (typeof value === "string" ? value : "")}
      prefix={application?.groupPrefix}
    />
  );
};

/** The roles a group bundles: the access role, then application roles. */
export const GroupRolesCell = ({ column, dataRow }: TableCellRendererProps) => {
  const { model } = useApplicationModel();
  const group = model.groupsById.get(String(dataRow.group_id));
  const applicationName = model.groupApplication.get(String(dataRow.group_id));
  const category = useApplicationCategory(applicationName);
  if (!group) {
    return <>{String(dataRow[column.name] ?? "")}</>;
  }
  const accessRole = applicationName
    ? model.byName.get(applicationName)?.accessRole
    : undefined;
  const roles = group.roleIds.flatMap((roleId) => {
    const role = model.rolesById.get(roleId);
    return role && role.roleId !== accessRole?.roleId ? [role] : [];
  });
  if (!group.hasAccessRole && roles.length === 0) {
    return (
      <Text color="secondary" styleAs="label">
        No roles
      </Text>
    );
  }
  return (
    <span className={`vuuAdminUi-tags ${classBase}-tags`}>
      {group.hasAccessRole ? <AccessTag /> : null}
      {roles.map((role) => (
        <Tag
          category={
            model.roleApplication.get(role.roleId) === applicationName
              ? category
              : undefined
          }
          key={role.roleId}
        >
          {role.roleName}
        </Tag>
      ))}
    </span>
  );
};

/** Renders the application a role belongs to, from its client and role name. */
export const RoleApplicationCell = ({ dataRow }: TableCellRendererProps) => (
  <ApplicationLabel application={useRoleClassification(dataRow)?.application} />
);

/** The role name in code style, with its description beneath. */
export const RoleNameCell = ({ column, dataRow }: TableCellRendererProps) => {
  const description =
    typeof dataRow.description === "string" ? dataRow.description : "";
  return (
    <span className="vuuAdminUi-stack" title={description || undefined}>
      <RoleName>{String(dataRow[column.name] ?? "")}</RoleName>
      {description ? (
        <Text color="secondary" styleAs="label">
          {description}
        </Text>
      ) : null}
    </span>
  );
};

/** "Access" for portal access roles, otherwise "Application". */
export const RoleTypeCell = ({ dataRow }: TableCellRendererProps) => {
  const match = useRoleClassification(dataRow);
  const category = useApplicationCategory(match?.application.name);
  if (match?.kind === "access") return <AccessTag />;
  return match ? (
    <Tag category={category}>Application</Tag>
  ) : (
    <Tag>Unassigned</Tag>
  );
};

const register = (name: string, component: FC<TableCellRendererProps>) =>
  registerComponent(name, component, "cell-renderer", {
    serverDataType: ["string", "int", "long"],
    userCanAssign: false,
  });

register(GROUP_APPLICATION_CELL_RENDERER, GroupApplicationCell);
register(GROUP_NAME_CELL_RENDERER, GroupNameCell);
register(GROUP_ROLES_CELL_RENDERER, GroupRolesCell);
register(ROLE_APPLICATION_CELL_RENDERER, RoleApplicationCell);
register(ROLE_NAME_CELL_RENDERER, RoleNameCell);
register(ROLE_TYPE_CELL_RENDERER, RoleTypeCell);
