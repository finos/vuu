import {
  Avatar,
  Banner,
  BannerContent,
  Card,
  H3,
  StatusIndicator,
  Text,
} from "@salt-ds/core";
import { FolderOpenIcon, KeyIcon, UserGroupIcon } from "@salt-ds/icons";
import { Navigate } from "react-router-dom";
import {
  PageHeader,
  plural,
  RoleName,
} from "../../components/admin-ui/AdminUi";
import { ApplicationCard } from "../../components/ApplicationCard";
import { IssueList } from "../../components/IssueList";
import { UNASSIGNED } from "../../data/applications";
import { useAdminPaths } from "../../data/useAdminPaths";
import { useApplicationModel } from "../../data/useApplicationModel";
import { useApplicationParam } from "../../data/useApplicationScope";

import "./ApplicationsPage.css";

const classBase = "vuuAdminApplications";

/** Groups and roles that match no application's naming convention. */
const Unassigned = () => {
  const { model } = useApplicationModel();
  return (
    <Card
      aria-label="Unassigned"
      className={`${classBase}-unassigned`}
      role="region"
    >
      <header className={`${classBase}-unassignedHeader`}>
        <Avatar
          aria-hidden
          color="category-20"
          fallbackIcon={<FolderOpenIcon />}
          size={1.75}
        />
        <span className="vuuAdminUi-stack">
          <H3>Unassigned</H3>
          <Text color="secondary">
            These groups and roles do not match any application's naming
            convention, so they grant no application access. Rename them in
            Keycloak to link them to an application.
          </Text>
        </span>
        <StatusIndicator aria-label="Needs review" status="warning" />
      </header>
      <div className={`${classBase}-unassignedLists`}>
        <section className="vuuIdentityAdmin-section">
          <Text styleAs="label">
            <strong>{plural(model.unmatchedGroups.length, "group")}</strong>
          </Text>
          <ul className="vuuAdminUi-roleList">
            {model.unmatchedGroups.map((group) => (
              <li className="vuuAdminUi-roleRow" key={group.groupId}>
                <UserGroupIcon aria-hidden />
                <strong>{group.groupName || group.path}</strong>
              </li>
            ))}
          </ul>
        </section>
        <section className="vuuIdentityAdmin-section">
          <Text styleAs="label">
            <strong>{plural(model.unmatchedRoles.length, "role")}</strong>
          </Text>
          <ul className="vuuAdminUi-roleList">
            {model.unmatchedRoles.map((role) => (
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
      </div>
    </Card>
  );
};

export const ApplicationsPage = () => {
  const { error, loading, model } = useApplicationModel();
  const paths = useAdminPaths();
  const [legacyApplication] = useApplicationParam();
  const hasUnassigned =
    model.unmatchedGroups.length > 0 || model.unmatchedRoles.length > 0;
  const globalIssues = model.issues.filter(
    ({ application }) => !application || !model.byName.has(application),
  );

  // Links from before applications had their own page.
  if (legacyApplication && legacyApplication !== UNASSIGNED) {
    return <Navigate replace to={paths.application(legacyApplication)} />;
  }

  return (
    <section className={`vuuIdentityAdmin-page ${classBase}`}>
      <PageHeader
        description="Open an application to set up its groups and roles, and to choose who can use it."
        title="Applications"
      />
      {error ? (
        <Banner status="error">
          <BannerContent role="alert">{error}</BannerContent>
        </Banner>
      ) : null}
      {loading ? <p role="status">Loading applications...</p> : null}
      {globalIssues.length > 0 ? (
        <Banner status="warning">
          <BannerContent>
            <details>
              <summary>
                {plural(globalIssues.length, "configuration issue")} outside any
                application
              </summary>
              <IssueList issues={globalIssues} />
            </details>
          </BannerContent>
        </Banner>
      ) : null}
      {model.applications.length === 0 && !loading ? (
        <p className="vuuIdentityAdmin-empty">
          No applications are registered with the portal.
        </p>
      ) : (
        <div
          aria-label="Applications"
          className={`${classBase}-cards`}
          role="list"
        >
          {model.applications.map((entry) => (
            <div key={entry.application.name} role="listitem">
              <ApplicationCard entry={entry} />
            </div>
          ))}
        </div>
      )}
      {hasUnassigned ? <Unassigned /> : null}
    </section>
  );
};
