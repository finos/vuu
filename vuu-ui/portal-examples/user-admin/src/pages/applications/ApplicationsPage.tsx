import {
  Avatar,
  Badge,
  Banner,
  BannerContent,
  Card,
  Code,
  H3,
  H4,
  InteractableCard,
  InteractableCardGroup,
  Label,
  StatusIndicator,
  Tab,
  TabBar,
  TabList,
  TabPanel,
  Tabs,
  TabTrigger,
  Table as SaltTable,
  TBody,
  TD,
  Text,
  TH,
  THead,
  TR,
  Tag,
} from "@salt-ds/core";
import {
  AddIcon,
  AddUserIcon,
  ChevronRightIcon,
  FolderOpenIcon,
  KeyIcon,
  LinkedIcon,
  UserGroupIcon,
} from "@salt-ds/icons";
import { useData } from "@vuu-ui/core";
import { Table } from "@vuu-ui/vuu-table";
import { filterAsQuery } from "@vuu-ui/vuu-utils";
import { type ReactNode, useMemo } from "react";
import {
  AccessTag,
  AdminButtonLink,
  AdminLink,
  AppAvatar,
  GroupName,
  IconTile,
  PageHeader,
  plural,
  RoleName,
  StatusText,
  useApplicationCategory,
} from "../../components/admin-ui/AdminUi";
import {
  type ApplicationDetails,
  type ApplicationGroup,
  type ApplicationModel,
  type HealthIssue,
  moduleAccessFilter,
  PORTAL_CLIENT_IDENTIFIER,
  UNASSIGNED,
} from "../../data/applications";
import { USER_ADMIN_TABLES } from "../../data/user-admin-tables";
import { useApplicationModel } from "../../data/useApplicationModel";
import {
  APPLICATION_PARAM,
  useApplicationParam,
} from "../../data/useApplicationScope";
import { useFilteredCount } from "../../data/useFilteredCount";
import {
  USER_COLUMNS,
  USER_ROW_HEIGHT,
  usersTableConfig,
} from "../users/usersTable";

import "./ApplicationsPage.css";

const classBase = "vuuAdminApplications";

export const pageLink = (
  page: "groups" | "roles" | "users",
  application: string,
  create = false,
) => {
  const params = new URLSearchParams({ [APPLICATION_PARAM]: application });
  if (create) params.set("create", "true");
  return `../${page}?${params}`;
};

export const useUserCount = (accessRole: string) => {
  const filter = useMemo(() => moduleAccessFilter(accessRole), [accessRole]);
  return useFilteredCount(USER_ADMIN_TABLES.users, "user_id", filter);
};

export { plural };

export const formatCount = ({
  count,
  error,
}: {
  count?: number;
  error?: string;
}) => (error ? "–" : count === undefined ? "…" : count.toLocaleString());

/** "Healthy", or the number of configuration issues. */
export const IssueBadge = ({ issues }: { issues: readonly HealthIssue[] }) =>
  issues.length > 0 ? (
    <span title={issues.map(({ message }) => message).join("\n")}>
      <StatusText status="warning">
        {issues.length} {issues.length === 1 ? "issue" : "issues"}
      </StatusText>
    </span>
  ) : (
    <StatusText status="success">Healthy</StatusText>
  );

const ApplicationListItem = ({ entry }: { entry: ApplicationDetails }) => {
  const users = useUserCount(entry.application.accessRole);
  return (
    <InteractableCard
      accent="left"
      className={`${classBase}-listItem`}
      value={entry.application.name}
    >
      <AppAvatar application={entry.application} size={1.5} />
      <span className="vuuAdminUi-stack">
        <strong className={`${classBase}-listTitle`}>
          {entry.application.title}
        </strong>
        <Text color="secondary" styleAs="label">
          {users.count === undefined
            ? `${formatCount(users)} users`
            : plural(users.count, "user")}{" "}
          · {plural(entry.groups.length, "group")} ·{" "}
          {plural(entry.roles.length, "role")}
        </Text>
      </span>
      <StatusIndicator
        aria-label={
          entry.issues.length > 0
            ? `${plural(entry.issues.length, "issue")}`
            : "Healthy"
        }
        status={entry.issues.length > 0 ? "warning" : "success"}
      />
    </InteractableCard>
  );
};

const groupProblems = (entry: ApplicationDetails, group: ApplicationGroup) => [
  ...(entry.accessRole && !group.hasAccessRole ? ["Missing access role"] : []),
  ...(group.foreignRoles.length > 0
    ? [
        `Roles from other applications: ${group.foreignRoles.map(({ roleName }) => roleName).join(", ")}`,
      ]
    : []),
];

const GroupRoleTags = ({
  entry,
  group,
  model,
}: {
  entry: ApplicationDetails;
  group: ApplicationGroup;
  model: ApplicationModel;
}) => {
  const category = useApplicationCategory(entry.application.name);
  const roles = group.roleIds.flatMap((roleId) => {
    const role = model.rolesById.get(roleId);
    return role && role.roleId !== entry.accessRole?.roleId ? [role] : [];
  });
  return (
    <span className="vuuAdminUi-tags">
      {group.hasAccessRole ? <AccessTag /> : null}
      {roles.map((role) => (
        <Tag category={category} key={role.roleId}>
          {role.roleName}
        </Tag>
      ))}
      {!group.hasAccessRole && roles.length === 0 ? "–" : null}
    </span>
  );
};

const GroupsTable = ({
  entry,
  model,
}: {
  entry: ApplicationDetails;
  model: ApplicationModel;
}) =>
  entry.groups.length === 0 ? (
    <Banner status="warning">
      <BannerContent role="status">
        No groups named "{entry.application.groupPrefix}*" exist. Create one so
        users can be given access to {entry.application.title}.
      </BannerContent>
    </Banner>
  ) : (
    <SaltTable
      aria-label="Application groups"
      className={`${classBase}-table`}
      divider="tertiary"
    >
      <THead>
        <TR>
          <TH>Group</TH>
          <TH>Members</TH>
          <TH>Roles</TH>
          <TH>Status</TH>
        </TR>
      </THead>
      <TBody>
        {entry.groups.map((group) => {
          const problems = groupProblems(entry, group);
          return (
            <TR key={group.groupId}>
              <TD>
                <GroupName
                  name={group.groupName}
                  prefix={entry.application.groupPrefix}
                />
              </TD>
              <TD>{plural(group.userCount, "member")}</TD>
              <TD>
                <GroupRoleTags entry={entry} group={group} model={model} />
              </TD>
              <TD>
                {problems.length > 0 ? (
                  <StatusText status="warning">
                    {problems.join("; ")}
                  </StatusText>
                ) : (
                  <StatusText status="success">Healthy</StatusText>
                )}
              </TD>
            </TR>
          );
        })}
      </TBody>
    </SaltTable>
  );

const RolesTable = ({ entry }: { entry: ApplicationDetails }) => {
  const category = useApplicationCategory(entry.application.name);
  return (
    <SaltTable
      aria-label="Application roles"
      className={`${classBase}-table`}
      divider="tertiary"
    >
      <THead>
        <TR>
          <TH>Role</TH>
          <TH>Type</TH>
          <TH>Client</TH>
          <TH>Groups</TH>
        </TR>
      </THead>
      <TBody>
        <TR>
          <TD>
            <RoleName>{entry.application.accessRole}</RoleName>
          </TD>
          <TD>
            {entry.accessRole ? (
              <AccessTag />
            ) : (
              <StatusText status="warning">Access role missing</StatusText>
            )}
          </TD>
          <TD>{PORTAL_CLIENT_IDENTIFIER}</TD>
          <TD>{entry.accessRole?.groupCount ?? 0}</TD>
        </TR>
        {entry.roles.map((role) => (
          <TR key={role.roleId}>
            <TD>
              <RoleName>{role.roleName}</RoleName>
            </TD>
            <TD>
              <Tag category={category}>Application</Tag>
            </TD>
            <TD>{role.clientIdentifier}</TD>
            <TD>
              {role.groupCount === 0 ? (
                <StatusText status="warning">Not in any group</StatusText>
              ) : (
                role.groupCount
              )}
            </TD>
          </TR>
        ))}
      </TBody>
    </SaltTable>
  );
};

const ApplicationUsers = ({ accessRole }: { accessRole: string }) => {
  const { VuuDataSource } = useData();
  const config = useMemo(() => usersTableConfig({ compact: true }), []);
  const dataSource = useMemo(() => {
    const filterStruct = moduleAccessFilter(accessRole);
    return new VuuDataSource({
      columns: USER_COLUMNS,
      filterSpec: { filter: filterAsQuery(filterStruct), filterStruct },
      table: USER_ADMIN_TABLES.users,
    });
  }, [VuuDataSource, accessRole]);
  return (
    <div className={`vuuIdentityAdmin-tableCard ${classBase}-users`}>
      <Table
        config={config}
        dataSource={dataSource}
        rowHeight={USER_ROW_HEIGHT}
      />
    </div>
  );
};

const IssueList = ({ issues }: { issues: readonly HealthIssue[] }) =>
  issues.length === 0 ? (
    <p role="status">
      <StatusText status="success">No configuration issues found.</StatusText>
    </p>
  ) : (
    <ul className={`${classBase}-issues`} aria-label="Configuration issues">
      {issues.map((issue, index) => (
        <li key={`${issue.code}:${index}`}>
          <StatusIndicator status="warning" />
          <span>{issue.message}</span>
        </li>
      ))}
    </ul>
  );

const Fact = ({
  icon,
  label,
  note,
  value,
}: {
  icon: ReactNode;
  label: string;
  note: ReactNode;
  value: string;
}) => (
  <Card className={`${classBase}-fact`} variant="secondary">
    <IconTile>{icon}</IconTile>
    <span className="vuuAdminUi-stack">
      <Label color="secondary">{label}</Label>
      <Code className={`${classBase}-factValue`}>{value}</Code>
      <Text color="secondary" styleAs="label">
        {note}
      </Text>
    </span>
  </Card>
);

const TabLabel = ({ count, label }: { count: number; label: string }) => (
  <TabTrigger>
    {label}
    <Badge aria-label={`${count}`} value={count} />
  </TabTrigger>
);

const ApplicationDetailsView = ({
  entry,
  model,
}: {
  entry: ApplicationDetails;
  model: ApplicationModel;
}) => {
  const { application } = entry;
  const users = useUserCount(application.accessRole);
  return (
    <Card
      className={`${classBase}-details`}
      aria-label={`${application.title} access`}
      role="region"
    >
      <header className={`${classBase}-detailsHeader`}>
        <AppAvatar application={application} size={2.5} />
        <div className="vuuAdminUi-stack">
          <H3>{application.title}</H3>
          {application.description ? (
            <Text color="secondary">{application.description}</Text>
          ) : null}
          <Text color="secondary">
            <strong className={`${classBase}-userCount`}>
              {users.count === undefined
                ? `${formatCount(users)} users`
                : plural(users.count, "user")}
            </strong>{" "}
            with access
          </Text>
        </div>
        <nav aria-label="Application actions" className="vuuAdminUi-actions">
          <AdminButtonLink to={pageLink("roles", application.name, true)}>
            <KeyIcon aria-hidden /> Create role
          </AdminButtonLink>
          <AdminButtonLink to={pageLink("groups", application.name, true)}>
            <AddIcon aria-hidden /> Create group
          </AdminButtonLink>
          <AdminButtonLink
            sentiment="accented"
            to={pageLink("users", application.name)}
          >
            <AddUserIcon aria-hidden /> Grant access
          </AdminButtonLink>
        </nav>
      </header>
      <div className={`${classBase}-facts`}>
        <Fact
          icon={<KeyIcon aria-hidden />}
          label="Access role"
          note={
            entry.accessRole ? (
              `On the ${PORTAL_CLIENT_IDENTIFIER} client`
            ) : (
              <StatusText status="warning">Missing in Keycloak</StatusText>
            )
          }
          value={application.accessRole}
        />
        <Fact
          icon={<LinkedIcon aria-hidden />}
          label="Application client"
          note={
            entry.client ? (
              entry.client.clientName || "Owns the application's roles"
            ) : (
              <StatusText status="warning">Missing in Keycloak</StatusText>
            )
          }
          value={application.clientIdentifier}
        />
        <Fact
          icon={<UserGroupIcon aria-hidden />}
          label="Group prefix"
          note="Groups named like this belong here"
          value={`${application.groupPrefix}*`}
        />
      </div>
      <Tabs defaultValue="groups">
        <TabBar divider>
          <TabList>
            <Tab value="groups">
              <TabLabel count={entry.groups.length} label="Groups" />
            </Tab>
            <Tab value="roles">
              <TabLabel count={entry.roles.length + 1} label="Roles" />
            </Tab>
            <Tab value="users">
              <TabTrigger>Users</TabTrigger>
            </Tab>
            <Tab value="checks">
              <TabTrigger>
                Checks
                {entry.issues.length > 0 ? (
                  <Badge
                    aria-label={`${entry.issues.length}`}
                    value={entry.issues.length}
                  />
                ) : (
                  <StatusIndicator status="success" />
                )}
              </TabTrigger>
            </Tab>
          </TabList>
        </TabBar>
        <TabPanel value="groups">
          <Text color="secondary">
            Users get access to {application.title} by joining one of these
            groups. Each group includes the {application.accessRole} role plus
            the application roles listed.
          </Text>
          <GroupsTable entry={entry} model={model} />
          <AdminLink
            IconComponent={ChevronRightIcon}
            to={pageLink("groups", application.name)}
          >
            Open in Groups
          </AdminLink>
        </TabPanel>
        <TabPanel value="roles">
          <RolesTable entry={entry} />
          <AdminLink
            IconComponent={ChevronRightIcon}
            to={pageLink("roles", application.name)}
          >
            Open in Roles
          </AdminLink>
        </TabPanel>
        <TabPanel value="users">
          <ApplicationUsers accessRole={application.accessRole} />
          <AdminLink
            IconComponent={ChevronRightIcon}
            to={pageLink("users", application.name)}
          >
            Open in Users
          </AdminLink>
        </TabPanel>
        <TabPanel value="checks">
          <IssueList issues={entry.issues} />
        </TabPanel>
      </Tabs>
    </Card>
  );
};

const UnassignedAvatar = ({ size }: { size: number }) => (
  <Avatar
    aria-hidden
    color="category-20"
    fallbackIcon={<FolderOpenIcon />}
    size={size}
  />
);

const UnassignedView = ({ model }: { model: ApplicationModel }) => (
  <Card
    aria-label="Unassigned"
    className={`${classBase}-details`}
    role="region"
  >
    <header className={`${classBase}-detailsHeader`}>
      <UnassignedAvatar size={2.5} />
      <div className="vuuAdminUi-stack">
        <H3>Unassigned</H3>
        <Text color="secondary">
          These groups and roles do not match any application's naming
          convention, so they do not grant access to any application.
        </Text>
      </div>
    </header>
    <nav
      aria-label="Unassigned actions"
      className="vuuIdentityAdmin-quickActions"
    >
      <AdminLink
        IconComponent={ChevronRightIcon}
        to={pageLink("groups", UNASSIGNED)}
      >
        Open in Groups
      </AdminLink>
      <AdminLink
        IconComponent={ChevronRightIcon}
        to={pageLink("roles", UNASSIGNED)}
      >
        Open in Roles
      </AdminLink>
    </nav>
    <section className="vuuIdentityAdmin-section">
      <H4>Groups ({model.unmatchedGroups.length})</H4>
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
      <H4>Roles ({model.unmatchedRoles.length})</H4>
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
  </Card>
);

export const ApplicationsPage = () => {
  const { error, loading, model } = useApplicationModel();
  const [param, setApplication] = useApplicationParam();
  const hasUnassigned =
    model.unmatchedGroups.length > 0 || model.unmatchedRoles.length > 0;
  const selected =
    param === UNASSIGNED && hasUnassigned
      ? UNASSIGNED
      : model.byName.has(param)
        ? param
        : model.applications[0]?.application.name;
  const entry = selected ? model.byName.get(selected) : undefined;
  const globalIssues = model.issues.filter(
    ({ application }) => !application || !model.byName.has(application),
  );

  return (
    <section className={`vuuIdentityAdmin-page ${classBase}`}>
      <PageHeader
        description="Users get access to an application by joining one of its groups."
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
            <details className={`${classBase}-globalIssues`}>
              <summary>
                {globalIssues.length} configuration{" "}
                {globalIssues.length === 1 ? "issue" : "issues"} outside any
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
        <div className={`${classBase}-layout`}>
          <InteractableCardGroup
            aria-label="Applications"
            className={`${classBase}-list`}
            onChange={(_event, value) => {
              if (typeof value === "string") setApplication(value);
            }}
            value={selected ?? ""}
          >
            {model.applications.map((candidate) => (
              <ApplicationListItem
                entry={candidate}
                key={candidate.application.name}
              />
            ))}
            {hasUnassigned ? (
              <InteractableCard
                accent="left"
                className={`${classBase}-listItem`}
                value={UNASSIGNED}
              >
                <UnassignedAvatar size={1.5} />
                <span className="vuuAdminUi-stack">
                  <strong className={`${classBase}-listTitle`}>
                    Unassigned
                  </strong>
                  <Text color="secondary" styleAs="label">
                    {plural(model.unmatchedGroups.length, "group")} ·{" "}
                    {plural(model.unmatchedRoles.length, "role")}
                  </Text>
                </span>
                <StatusIndicator aria-label="Needs review" status="warning" />
              </InteractableCard>
            ) : null}
          </InteractableCardGroup>
          {selected === UNASSIGNED ? (
            <UnassignedView model={model} />
          ) : entry ? (
            <ApplicationDetailsView entry={entry} model={model} />
          ) : null}
        </div>
      )}
    </section>
  );
};
