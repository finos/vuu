import { Avatar, Card, H3, StatusIndicator, Text } from "@salt-ds/core";
import { FolderOpenIcon, KeyIcon, UserGroupIcon } from "@salt-ds/icons";
import { plural, RoleName } from "../../components/admin-ui/AdminUi";
import { useApplicationModel } from "../../data/useApplicationModel";

const classBase = "vuuAdminUnassigned";

/** Groups and roles that match no application's naming convention. */
export const UnassignedCard = () => {
  const { model } = useApplicationModel();
  const { unmatchedGroups, unmatchedRoles } = model;
  if (unmatchedGroups.length === 0 && unmatchedRoles.length === 0) {
    return null;
  }
  return (
    <Card aria-label="Unassigned" className={classBase} role="region">
      <header className={`${classBase}-header`}>
        <Avatar
          aria-hidden
          color="category-20"
          fallbackIcon={<FolderOpenIcon />}
          size={1.75}
        />
        <span className="vuuAdminUi-stack">
          <H3>Unassigned groups and roles</H3>
          <Text color="secondary">
            These do not match any application's naming convention, so they
            grant no application access. Rename them in Keycloak to link them to
            an application.
          </Text>
        </span>
        <StatusIndicator aria-label="Needs review" status="warning" />
      </header>
      <div className={`${classBase}-lists`}>
        {unmatchedGroups.length > 0 ? (
          <section className="vuuIdentityAdmin-section">
            <Text styleAs="label">
              <strong>{plural(unmatchedGroups.length, "group")}</strong>
            </Text>
            <ul className="vuuAdminUi-roleList">
              {unmatchedGroups.map((group) => (
                <li className="vuuAdminUi-roleRow" key={group.groupId}>
                  <UserGroupIcon aria-hidden />
                  <strong>{group.groupName || group.path}</strong>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {unmatchedRoles.length > 0 ? (
          <section className="vuuIdentityAdmin-section">
            <Text styleAs="label">
              <strong>{plural(unmatchedRoles.length, "role")}</strong>
            </Text>
            <ul className="vuuAdminUi-roleList">
              {unmatchedRoles.map((role) => (
                <li className="vuuAdminUi-roleRow" key={role.roleId}>
                  <KeyIcon aria-hidden />
                  <RoleName>{role.roleName}</RoleName>
                  <Text color="secondary" styleAs="label">
                    {role.clientIdentifier || "no client"}
                  </Text>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </Card>
  );
};
