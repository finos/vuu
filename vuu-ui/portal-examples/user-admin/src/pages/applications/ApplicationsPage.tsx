import {
  Tab,
  TabBar,
  TabList,
  TabPanel,
  Tabs,
  TabTrigger,
} from "@salt-ds/core";
import { useData } from "@vuu-ui/core";
import { Table } from "@vuu-ui/vuu-table";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { filterAsQuery } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { MODULE_ACCESS_CELL_RENDERER } from "../../components/ModuleAccessCell";
import {
  type ApplicationDetails,
  type ApplicationGroup,
  type ApplicationModel,
  type HealthIssue,
  moduleAccessFilter,
  UNASSIGNED,
} from "../../data/applications";
import { USER_ADMIN_TABLES } from "../../data/user-admin-tables";
import { useApplicationModel } from "../../data/useApplicationModel";
import {
  APPLICATION_PARAM,
  useApplicationParam,
} from "../../data/useApplicationScope";
import { useFilteredCount } from "../../data/useFilteredCount";

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

export const plural = (count: number, noun: string) =>
  `${count.toLocaleString()} ${noun}${count === 1 ? "" : "s"}`;

export const formatCount = ({
  count,
  error,
}: {
  count?: number;
  error?: string;
}) => (error ? "–" : count === undefined ? "…" : count.toLocaleString());

export const IssueBadge = ({ issues }: { issues: readonly HealthIssue[] }) =>
  issues.length > 0 ? (
    <span
      className={`${classBase}-issueBadge`}
      title={issues.map(({ message }) => message).join("\n")}
    >
      {issues.length} {issues.length === 1 ? "issue" : "issues"}
    </span>
  ) : (
    <span className={`${classBase}-okBadge`}>OK</span>
  );

const ApplicationListItem = ({
  entry,
  selected,
  onSelect,
}: {
  entry: ApplicationDetails;
  onSelect: (name: string) => void;
  selected: boolean;
}) => {
  const users = useUserCount(entry.application.accessRole);
  return (
    <li>
      <button
        aria-current={selected ? "true" : undefined}
        className={`${classBase}-listItem`}
        onClick={() => onSelect(entry.application.name)}
        type="button"
      >
        <span className={`${classBase}-listTitle`}>
          {entry.application.title}
          <IssueBadge issues={entry.issues} />
        </span>
        <span className={`${classBase}-listMeta`}>
          {users.count === undefined
            ? `${formatCount(users)} users`
            : plural(users.count, "user")}{" "}
          · {plural(entry.groups.length, "group")} ·{" "}
          {plural(entry.roles.length, "role")}
        </span>
      </button>
    </li>
  );
};

const groupStatus = (entry: ApplicationDetails, group: ApplicationGroup) => {
  const problems = [
    ...(entry.accessRole && !group.hasAccessRole
      ? ["Missing access role"]
      : []),
    ...(group.foreignRoles.length > 0
      ? [
          `Roles from other applications: ${group.foreignRoles.map(({ roleName }) => roleName).join(", ")}`,
        ]
      : []),
  ];
  return problems.length > 0 ? (
    <span className={`${classBase}-problem`}>{problems.join("; ")}</span>
  ) : (
    "OK"
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
    <p role="status">
      No groups named "{entry.application.groupPrefix}*" exist. Create one so
      users can be given access to {entry.application.title}.
    </p>
  ) : (
    <table className={`${classBase}-table`} aria-label="Application groups">
      <thead>
        <tr>
          <th>Group</th>
          <th>Users</th>
          <th>Roles</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {entry.groups.map((group) => (
          <tr key={group.groupId}>
            <td>{group.groupName}</td>
            <td>{group.userCount}</td>
            <td>
              {group.roleIds
                .flatMap((roleId) => {
                  const role = model.rolesById.get(roleId);
                  return role && role.roleId !== entry.accessRole?.roleId
                    ? [role.roleName]
                    : [];
                })
                .join(", ") || "–"}
            </td>
            <td>{groupStatus(entry, group)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

const RolesTable = ({ entry }: { entry: ApplicationDetails }) => (
  <table className={`${classBase}-table`} aria-label="Application roles">
    <thead>
      <tr>
        <th>Role</th>
        <th>Type</th>
        <th>Groups</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{entry.application.accessRole}</td>
        <td>
          Access (vuu-portal)
          {entry.accessRole ? null : (
            <span className={`${classBase}-problem`}> – missing</span>
          )}
        </td>
        <td>{entry.accessRole?.groupCount ?? 0}</td>
      </tr>
      {entry.roles.map((role) => (
        <tr key={role.roleId}>
          <td>{role.roleName}</td>
          <td>Application</td>
          <td>
            {role.groupCount === 0 ? (
              <span className={`${classBase}-problem`}>Not in any group</span>
            ) : (
              role.groupCount
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const userTableConfig: TableConfig = {
  columns: [
    { name: "username", label: "User name" },
    { name: "email", label: "Email", width: 220 },
    { name: "first_name", label: "First name" },
    { name: "last_name", label: "Last name" },
    {
      name: "module_access",
      label: "Applications",
      type: {
        name: "string",
        renderer: { name: MODULE_ACCESS_CELL_RENDERER },
      },
      width: 240,
    },
  ],
  columnSeparators: true,
  zebraStripes: true,
};
const userColumns = userTableConfig.columns.map(({ name }) => name);

const ApplicationUsers = ({ accessRole }: { accessRole: string }) => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    const filterStruct = moduleAccessFilter(accessRole);
    return new VuuDataSource({
      columns: userColumns,
      filterSpec: { filter: filterAsQuery(filterStruct), filterStruct },
      table: USER_ADMIN_TABLES.users,
    });
  }, [VuuDataSource, accessRole]);
  return (
    <div className={`${classBase}-users`}>
      <Table config={userTableConfig} dataSource={dataSource} />
    </div>
  );
};

const IssueList = ({ issues }: { issues: readonly HealthIssue[] }) =>
  issues.length === 0 ? (
    <p role="status">No configuration issues found.</p>
  ) : (
    <ul className={`${classBase}-issues`} aria-label="Configuration issues">
      {issues.map((issue, index) => (
        <li key={`${issue.code}:${index}`}>{issue.message}</li>
      ))}
    </ul>
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
    <section
      className={`${classBase}-details`}
      aria-label={`${application.title} access`}
    >
      <header>
        <h3>{application.title}</h3>
        {application.description ? <p>{application.description}</p> : null}
      </header>
      <dl className="vuuIdentityAdmin-details">
        <div>
          <dt>Users with access</dt>
          <dd>{formatCount(users)}</dd>
        </div>
        <div>
          <dt>Access role</dt>
          <dd>
            {application.accessRole}
            {entry.accessRole ? null : " (missing in Keycloak)"}
          </dd>
        </div>
        <div>
          <dt>Application client</dt>
          <dd>
            {entry.client
              ? entry.client.clientName || entry.client.clientIdentifier
              : `${application.clientIdentifier} (missing in Keycloak)`}
          </dd>
        </div>
        <div>
          <dt>Group prefix</dt>
          <dd>{application.groupPrefix}</dd>
        </div>
      </dl>
      <nav
        aria-label="Application actions"
        className="vuuIdentityAdmin-quickActions"
      >
        <Link relative="path" to={pageLink("users", application.name)}>
          Manage user access
        </Link>
        <Link relative="path" to={pageLink("groups", application.name, true)}>
          Create group
        </Link>
        <Link relative="path" to={pageLink("roles", application.name, true)}>
          Create role
        </Link>
        <Link relative="path" to={pageLink("groups", application.name)}>
          Open in Groups
        </Link>
        <Link relative="path" to={pageLink("roles", application.name)}>
          Open in Roles
        </Link>
      </nav>
      <Tabs defaultValue="groups">
        <TabBar inset divider>
          <TabList appearance="bordered">
            <Tab value="groups">
              <TabTrigger>Groups ({entry.groups.length})</TabTrigger>
            </Tab>
            <Tab value="roles">
              <TabTrigger>Roles ({entry.roles.length + 1})</TabTrigger>
            </Tab>
            <Tab value="users">
              <TabTrigger>Users</TabTrigger>
            </Tab>
            <Tab value="checks">
              <TabTrigger>Checks ({entry.issues.length})</TabTrigger>
            </Tab>
          </TabList>
        </TabBar>
        <TabPanel value="groups">
          <p>
            Users get access to {application.title} by joining one of these
            groups. Each group includes the {application.accessRole} role plus
            the application roles listed.
          </p>
          <GroupsTable entry={entry} model={model} />
        </TabPanel>
        <TabPanel value="roles">
          <RolesTable entry={entry} />
        </TabPanel>
        <TabPanel value="users">
          <ApplicationUsers accessRole={application.accessRole} />
        </TabPanel>
        <TabPanel value="checks">
          <IssueList issues={entry.issues} />
        </TabPanel>
      </Tabs>
    </section>
  );
};

const UnassignedView = ({ model }: { model: ApplicationModel }) => (
  <section className={`${classBase}-details`} aria-label="Unassigned">
    <header>
      <h3>Unassigned</h3>
      <p>
        These groups and roles do not match any application's naming convention,
        so they do not grant access to any application.
      </p>
    </header>
    <nav
      aria-label="Unassigned actions"
      className="vuuIdentityAdmin-quickActions"
    >
      <Link relative="path" to={pageLink("groups", UNASSIGNED)}>
        Open in Groups
      </Link>
      <Link relative="path" to={pageLink("roles", UNASSIGNED)}>
        Open in Roles
      </Link>
    </nav>
    <h4>Groups ({model.unmatchedGroups.length})</h4>
    <ul>
      {model.unmatchedGroups.map((group) => (
        <li key={group.groupId}>{group.groupName || group.path}</li>
      ))}
    </ul>
    <h4>Roles ({model.unmatchedRoles.length})</h4>
    <ul>
      {model.unmatchedRoles.map((role) => (
        <li key={role.roleId}>
          {role.roleName} ({role.clientIdentifier || "no client"})
        </li>
      ))}
    </ul>
  </section>
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
      <header className="vuuIdentityAdmin-pageHeader">
        <div>
          <h2>Applications</h2>
          <p>
            Users are given access to an application by adding them to one of
            its groups.
          </p>
        </div>
      </header>
      {error ? <p role="alert">{error}</p> : null}
      {loading ? <p role="status">Loading applications...</p> : null}
      {globalIssues.length > 0 ? (
        <details className={`${classBase}-globalIssues`}>
          <summary>
            {globalIssues.length} configuration{" "}
            {globalIssues.length === 1 ? "issue" : "issues"} outside any
            application
          </summary>
          <IssueList issues={globalIssues} />
        </details>
      ) : null}
      {model.applications.length === 0 && !loading ? (
        <p className="vuuIdentityAdmin-empty">
          No applications are registered with the portal.
        </p>
      ) : (
        <div className={`${classBase}-layout`}>
          <ul className={`${classBase}-list`} aria-label="Applications">
            {model.applications.map((candidate) => (
              <ApplicationListItem
                entry={candidate}
                key={candidate.application.name}
                onSelect={setApplication}
                selected={candidate.application.name === selected}
              />
            ))}
            {hasUnassigned ? (
              <li>
                <button
                  aria-current={selected === UNASSIGNED ? "true" : undefined}
                  className={`${classBase}-listItem`}
                  onClick={() => setApplication(UNASSIGNED)}
                  type="button"
                >
                  <span className={`${classBase}-listTitle`}>Unassigned</span>
                  <span className={`${classBase}-listMeta`}>
                    {plural(model.unmatchedGroups.length, "group")} ·{" "}
                    {plural(model.unmatchedRoles.length, "role")}
                  </span>
                </button>
              </li>
            ) : null}
          </ul>
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
