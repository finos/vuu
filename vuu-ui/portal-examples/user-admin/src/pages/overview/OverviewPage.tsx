import {
  SidePanel,
  SidePanelCloseButton,
  SidePanelContent,
  SidePanelHeader,
  SidePanelProvider,
  SidePanelTitle,
} from "@salt-ds/core";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminSearch } from "../../components/AdminSearch";
import { OverviewTable } from "../../components/OverviewTable";
import { EntityDetails } from "../../components/EntityDetails";
import { useAdminConfig } from "../../data/AdminDataContext";
import {
  columnFor,
  ENTITY_LABELS,
  NAME_FIELDS,
  type AdminRecord,
  type Entity,
} from "../../data/admin-contract";
import type { ApplicationDetails } from "../../data/applications";
import { useApplicationModel } from "../../data/useApplicationModel";
import {
  formatCount,
  IssueBadge,
  plural,
  useUserCount,
} from "../applications/ApplicationsPage";

const applicationLink = (name: string) =>
  `../applications?${new URLSearchParams({ application: name })}`;

const ApplicationCard = ({ entry }: { entry: ApplicationDetails }) => {
  const { application } = entry;
  const users = useUserCount(application.accessRole);
  return (
    <section className="vuuIdentityAdmin-stat" aria-label={application.title}>
      <h3>
        <Link relative="path" to={applicationLink(application.name)}>
          {application.title}
        </Link>
      </h3>
      <strong>{formatCount(users)}</strong>
      <p>users with access</p>
      <p>
        {plural(entry.groups.length, "group")} ·{" "}
        {plural(entry.roles.length, "role")} ·{" "}
        <IssueBadge issues={entry.issues} />
      </p>
      {users.error ? <p role="alert">{users.error}</p> : null}
    </section>
  );
};

const ApplicationCards = () => {
  const { error, loading, model } = useApplicationModel();
  const issueCount = model.issues.length;
  return (
    <>
      {error ? <p role="alert">{error}</p> : null}
      <section className="vuuIdentityAdmin-stats" aria-label="Applications">
        {model.applications.map((entry) => (
          <ApplicationCard entry={entry} key={entry.application.name} />
        ))}
        {model.applications.length === 0 && !loading ? (
          <p className="vuuIdentityAdmin-empty">
            No applications are registered with the portal.
          </p>
        ) : null}
      </section>
      {!loading && issueCount > 0 ? (
        <p role="status">
          {issueCount} configuration {issueCount === 1 ? "issue" : "issues"}{" "}
          found.{" "}
          <Link relative="path" to="../applications">
            Review applications
          </Link>
        </p>
      ) : null}
    </>
  );
};

export const OverviewPage = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{
    entity: Entity;
    record: AdminRecord;
  }>();
  const config = useAdminConfig();
  return (
    <section className="vuuIdentityAdmin-page vuuIdentityAdmin-overview">
      <header className="vuuIdentityAdmin-pageHeader">
        <div>
          <h2>Overview</h2>
          <p>
            Who can open each portal application. Access is granted by adding
            users to an application's groups.
          </p>
        </div>
      </header>
      <ApplicationCards />
      <nav aria-label="Quick actions" className="vuuIdentityAdmin-quickActions">
        <strong>Quick actions</strong>
        <Link to="../users">Grant application access</Link>
        <Link to="../groups?create=true">Create application group</Link>
        <Link to="../roles?create=true">Create application role</Link>
      </nav>
      <AdminSearch
        label="Search users, groups and client roles"
        onSearch={(value) => {
          setSelected(undefined);
          setSearch(value);
        }}
      />
      <SidePanelProvider
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(undefined);
        }}
      >
        <div className="vuuIdentityAdmin-split">
          <div className="vuuIdentityAdmin-searchResults">
            {search ? (
              (["users", "groups", "roles"] as const).map((entity) => (
                <OverviewTable
                  key={`${entity}:${search}`}
                  name={entity}
                  query={{ search }}
                  title={ENTITY_LABELS[entity]}
                  onSelect={(record) =>
                    setSelected(record ? { entity, record } : undefined)
                  }
                />
              ))
            ) : (
              <p className="vuuIdentityAdmin-empty">
                Search across users, groups and client roles. Select a result to
                inspect its relationships.
              </p>
            )}
          </div>
          <SidePanel position="right" className="vuuIdentityAdmin-panel">
            <SidePanelHeader>
              <SidePanelTitle>
                {selected
                  ? String(
                      selected.record[
                        columnFor(
                          config,
                          selected.entity,
                          NAME_FIELDS[selected.entity],
                        )
                      ] ?? ENTITY_LABELS[selected.entity],
                    )
                  : "Identity details"}
              </SidePanelTitle>
              <SidePanelCloseButton />
            </SidePanelHeader>
            <SidePanelContent>
              {selected ? (
                <EntityDetails
                  entity={selected.entity}
                  record={selected.record}
                />
              ) : null}
            </SidePanelContent>
          </SidePanel>
        </div>
      </SidePanelProvider>
    </section>
  );
};
