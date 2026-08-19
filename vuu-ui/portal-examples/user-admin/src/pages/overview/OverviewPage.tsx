import {
  Banner,
  BannerContent,
  Card,
  Code,
  Divider,
  H3,
  SidePanel,
  SidePanelCloseButton,
  SidePanelContent,
  SidePanelHeader,
  SidePanelProvider,
  SidePanelTitle,
  Text,
} from "@salt-ds/core";
import {
  AddIcon,
  AddUserIcon,
  AppSwitcherIcon,
  ChevronRightIcon,
  KeyIcon,
  UserGroupIcon,
  UserIcon,
} from "@salt-ds/icons";
import { type ReactNode, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AdminButtonLink,
  AdminLink,
  AppAvatar,
  IconTile,
  Metric,
  PageHeader,
  useApplicationCategory,
} from "../../components/admin-ui/AdminUi";
import { EntityDetails } from "../../components/EntityDetails";
import { OverviewTable } from "../../components/OverviewTable";
import { useAdminConfig } from "../../data/AdminDataContext";
import {
  type AdminRecord,
  columnFor,
  ENTITY_LABELS,
  type Entity,
  NAME_FIELDS,
} from "../../data/admin-contract";
import type { ApplicationDetails } from "../../data/applications";
import { USER_ADMIN_TABLES } from "../../data/user-admin-tables";
import { useApplicationModel } from "../../data/useApplicationModel";
import { useFilteredCount } from "../../data/useFilteredCount";
import { SEARCH_PARAM } from "../../UserAdmin";
import {
  formatCount,
  IssueBadge,
  useUserCount,
} from "../applications/ApplicationsPage";

import "./OverviewPage.css";

const classBase = "vuuAdminOverview";

const applicationLink = (name: string) =>
  `../applications?${new URLSearchParams({ application: name })}`;

const Kpi = ({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) => (
  <Card className={`${classBase}-kpi`}>
    <IconTile size="large">{icon}</IconTile>
    <span className="vuuAdminUi-stack">
      <span className={`${classBase}-kpiValue`}>{value}</span>
      <Text color="secondary">{label}</Text>
    </span>
  </Card>
);

const Kpis = () => {
  const { loading, model } = useApplicationModel();
  const users = useFilteredCount(USER_ADMIN_TABLES.users, "user_id", undefined);
  const modelCount = (count: number) => (loading ? "…" : count);
  return (
    <section aria-label="Summary" className={`${classBase}-kpis`}>
      <Kpi
        icon={<AppSwitcherIcon aria-hidden size={1.5} />}
        label="Applications"
        value={modelCount(model.applications.length)}
      />
      <Kpi
        icon={<UserIcon aria-hidden size={1.5} />}
        label="Users"
        value={formatCount(users)}
      />
      <Kpi
        icon={<UserGroupIcon aria-hidden size={1.5} />}
        label="Groups"
        value={modelCount(model.groupsById.size)}
      />
      <Kpi
        icon={<KeyIcon aria-hidden size={1.5} />}
        label="Roles"
        value={modelCount(model.rolesById.size)}
      />
    </section>
  );
};

const ApplicationCard = ({ entry }: { entry: ApplicationDetails }) => {
  const { application } = entry;
  const users = useUserCount(application.accessRole);
  const category = useApplicationCategory(application.name);
  return (
    <Card
      accent="top"
      aria-label={application.title}
      className={`${classBase}-card`}
      role="region"
      style={
        category
          ? {
              ["--saltCard-accent-color" as string]: `var(--salt-category-${category}-bold-background)`,
            }
          : undefined
      }
    >
      <header className={`${classBase}-cardHeader`}>
        <AppAvatar application={application} size={1.75} />
        <span className="vuuAdminUi-stack">
          <H3>{application.title}</H3>
          {application.description ? (
            <Text color="secondary" styleAs="label">
              {application.description}
            </Text>
          ) : null}
        </span>
        <IssueBadge issues={entry.issues} />
      </header>
      <Divider variant="tertiary" />
      <div className={`${classBase}-metrics`}>
        <Metric label="Users with access" value={formatCount(users)} />
        <Metric label="Groups" value={entry.groups.length} />
        <Metric label="Roles" value={entry.roles.length} />
      </div>
      {users.error ? <p role="alert">{users.error}</p> : null}
      <footer className={`${classBase}-cardFooter`}>
        <KeyIcon aria-label="Access role" />
        <Code>{application.accessRole}</Code>
        <AdminLink
          IconComponent={ChevronRightIcon}
          aria-label={`Manage ${application.title}`}
          to={applicationLink(application.name)}
        >
          Manage
        </AdminLink>
      </footer>
    </Card>
  );
};

const ApplicationCards = () => {
  const { error, loading, model } = useApplicationModel();
  const issueCount = model.issues.length;
  return (
    <>
      {error ? (
        <Banner status="error">
          <BannerContent role="alert">{error}</BannerContent>
        </Banner>
      ) : null}
      {!loading && issueCount > 0 ? (
        <Banner status="warning">
          <BannerContent role="status">
            {issueCount} configuration {issueCount === 1 ? "issue" : "issues"}{" "}
            found.{" "}
            <AdminLink to="../applications">Review applications</AdminLink>
          </BannerContent>
        </Banner>
      ) : null}
      <section aria-label="Applications" className={`${classBase}-section`}>
        <H3>Applications</H3>
        {model.applications.length === 0 && !loading ? (
          <p className="vuuIdentityAdmin-empty">
            No applications are registered with the portal.
          </p>
        ) : (
          <div className={`${classBase}-cards`}>
            {model.applications.map((entry) => (
              <ApplicationCard entry={entry} key={entry.application.name} />
            ))}
          </div>
        )}
      </section>
    </>
  );
};

const SearchResults = ({ search }: { search: string }) => {
  const [selected, setSelected] = useState<{
    entity: Entity;
    record: AdminRecord;
  }>();
  const config = useAdminConfig();
  return (
    <SidePanelProvider
      open={!!selected}
      onOpenChange={(open) => {
        if (!open) setSelected(undefined);
      }}
    >
      <div className="vuuIdentityAdmin-split">
        <section
          aria-label="Search results"
          className="vuuIdentityAdmin-searchResults"
        >
          <H3>Results for "{search}"</H3>
          {(["users", "groups", "roles"] as const).map((entity) => (
            <OverviewTable
              key={`${entity}:${search}`}
              name={entity}
              query={{ search }}
              title={ENTITY_LABELS[entity]}
              onSelect={(record) =>
                setSelected(record ? { entity, record } : undefined)
              }
            />
          ))}
        </section>
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
  );
};

export const OverviewPage = () => {
  const [params] = useSearchParams();
  const search = params.get(SEARCH_PARAM)?.trim() ?? "";
  return (
    <section className={`vuuIdentityAdmin-page ${classBase}`}>
      <PageHeader
        actions={
          <nav aria-label="Quick actions" className="vuuAdminUi-actions">
            <AdminButtonLink to="../roles?create=true">
              <KeyIcon aria-hidden /> Create application role
            </AdminButtonLink>
            <AdminButtonLink to="../groups?create=true">
              <AddIcon aria-hidden /> Create application group
            </AdminButtonLink>
            <AdminButtonLink sentiment="accented" to="../users">
              <AddUserIcon aria-hidden /> Grant application access
            </AdminButtonLink>
          </nav>
        }
        description="Who can open each portal application. Access is granted by adding users to an application's groups."
        title="Overview"
      />
      {search ? (
        <SearchResults key={search} search={search} />
      ) : (
        <>
          <Kpis />
          <ApplicationCards />
        </>
      )}
    </section>
  );
};
