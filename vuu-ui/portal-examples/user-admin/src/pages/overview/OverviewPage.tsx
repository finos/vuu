import {
  Banner,
  BannerContent,
  Card,
  ComboBox,
  Dropdown,
  FormField,
  FormFieldLabel,
  H2,
  Input,
  Option,
  Text,
} from "@salt-ds/core";
import { AddIcon, ChevronRightIcon, SearchIcon } from "@salt-ds/icons";
import {
  type ChangeEvent,
  type SyntheticEvent,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import {
  AdminButtonLink,
  AdminLink,
  AppAvatar,
  plural,
  StatusText,
} from "../../components/admin-ui/AdminUi";
import { IssueList } from "../../components/IssueList";
import { formatCount, useUserCount } from "../../components/userCount";
import { UsersTable } from "../../components/UsersTable";
import type { ApplicationDetails } from "../../data/applications";
import { USER_ADMIN_TABLES } from "../../data/user-admin-tables";
import { useAdminPaths } from "../../data/useAdminPaths";
import { useApplicationModel } from "../../data/useApplicationModel";
import { userSearchFilter } from "../../data/useApplicationUsers";
import { useFilteredCount } from "../../data/useFilteredCount";
import {
  allApplicationsFilter,
  allOf,
  USER_SORT_OPTIONS,
  type UserSort,
} from "../../data/userList";
import { SEARCH_PARAM } from "../../UserAdmin";
import { UnassignedCard } from "./UnassignedCard";

import "./OverviewPage.css";

const classBase = "vuuAdminOverview";

const matches = (entry: ApplicationDetails, needle: string) => {
  const { accessRole, description = "", name, title } = entry.application;
  return [title, name, accessRole, description].some((value) =>
    value.toLocaleLowerCase().includes(needle),
  );
};

/**
 * The whole card opens the application. Its title link is stretched over the
 * card; the count links sit above it and open the matching tab.
 */
const ApplicationItem = ({ entry }: { entry: ApplicationDetails }) => {
  const { application, groups, issues, roles } = entry;
  const users = useUserCount(application.accessRole);
  const paths = useAdminPaths();
  const groupsTab = paths.application(application.name);
  const userCount =
    users.count === undefined
      ? `${formatCount(users)} users`
      : plural(users.count, "user");
  return (
    <li className={`${classBase}-application`}>
      <AppAvatar application={application} size={2} />
      <div className="vuuAdminUi-stack">
        <span className={`${classBase}-applicationTitle`}>
          <AdminLink className={`${classBase}-applicationLink`} to={groupsTab}>
            {application.title}
          </AdminLink>
          {issues.length > 0 ? (
            <span title={issues.map(({ message }) => message).join("\n")}>
              <StatusText status="warning">
                {plural(issues.length, "issue")}
              </StatusText>
            </span>
          ) : null}
        </span>
        {application.description ? (
          <Text
            className={`${classBase}-applicationDescription`}
            color="secondary"
          >
            {application.description}
          </Text>
        ) : null}
        <Text className={`${classBase}-counts`} styleAs="label">
          <AdminLink
            aria-label={`${application.title}: ${userCount}`}
            to={paths.application(application.name, "users")}
          >
            {userCount}
          </AdminLink>
          <span aria-hidden>·</span>
          <AdminLink
            aria-label={`${application.title}: ${plural(groups.length, "group")}`}
            to={groupsTab}
          >
            {plural(groups.length, "group")}
          </AdminLink>
          <span aria-hidden>·</span>
          <AdminLink
            aria-label={`${application.title}: ${plural(roles.length, "role")}`}
            to={groupsTab}
          >
            {plural(roles.length, "role")}
          </AdminLink>
        </Text>
      </div>
      <ChevronRightIcon aria-hidden className={`${classBase}-chevron`} />
    </li>
  );
};

const ApplicationsPanel = ({ initialSearch }: { initialSearch: string }) => {
  const { loading, model } = useApplicationModel();
  const [search, setSearch] = useState(initialSearch);
  const needle = search.trim().toLocaleLowerCase();
  const applications = model.applications.filter((entry) =>
    matches(entry, needle),
  );
  return (
    <Card
      aria-labelledby="overview-applications"
      className={`${classBase}-panel ${classBase}-applications`}
      role="region"
    >
      <div className={`${classBase}-panelHeader`}>
        <H2 id="overview-applications" styleAs="display4">
          Set up an application
        </H2>
        <Text color="secondary">
          Define its groups and roles, and choose who can use it.
        </Text>
        <Input
          bordered
          inputProps={{ "aria-label": "Filter applications" }}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setSearch(event.target.value)
          }
          placeholder="Filter applications"
          startAdornment={<SearchIcon aria-hidden />}
          value={search}
        />
      </div>
      {loading ? (
        <Text className={`${classBase}-empty`} color="secondary">
          Loading applications…
        </Text>
      ) : applications.length === 0 ? (
        <Text className={`${classBase}-empty`} color="secondary">
          {model.applications.length === 0
            ? "No applications are registered with the portal."
            : "No matching applications."}
        </Text>
      ) : (
        <ul aria-label="Applications" className={`${classBase}-list`}>
          {applications.map((entry) => (
            <ApplicationItem entry={entry} key={entry.application.name} />
          ))}
        </ul>
      )}
    </Card>
  );
};

const sortLabel = (sort: UserSort) =>
  USER_SORT_OPTIONS.find(({ value }) => value === sort)?.label ?? sort;

const UsersPanel = ({ initialSearch }: { initialSearch: string }) => {
  const paths = useAdminPaths();
  const { model } = useApplicationModel();
  const [searchText, setSearchText] = useState(initialSearch);
  const search = useDeferredValue(searchText);
  const [sort, setSort] = useState<UserSort>("changed");
  const [applicationText, setApplicationText] = useState("");
  const [applicationNames, setApplicationNames] = useState<string[]>([]);

  const chosen = useMemo(
    () =>
      applicationNames.flatMap((name) => {
        const entry = model.byName.get(name);
        return entry ? [entry.application] : [];
      }),
    [applicationNames, model],
  );
  const accessRoles = useMemo(
    () => chosen.map(({ accessRole }) => accessRole),
    [chosen],
  );
  const searchFilter = useMemo(() => userSearchFilter(search), [search]);
  const filter = useMemo(
    () => allOf(searchFilter.filter, allApplicationsFilter(accessRoles)),
    [accessRoles, searchFilter.filter],
  );
  const count = useFilteredCount(USER_ADMIN_TABLES.users, "user_id", filter);

  const titleOf = (name: string) =>
    model.byName.get(name)?.application.title ?? name;
  const needle = applicationText.trim().toLocaleLowerCase();
  const options = model.applications.filter((entry) => matches(entry, needle));

  return (
    <Card
      aria-labelledby="overview-users"
      className={`${classBase}-panel ${classBase}-users`}
      role="region"
    >
      <div className={`${classBase}-panelHeader`}>
        <div className={`${classBase}-titleRow`}>
          <div className="vuuAdminUi-stack">
            <H2 id="overview-users" styleAs="display4">
              Set up a user
            </H2>
            <Text color="secondary">
              Create a user, or open one to change the applications they can
              use.
            </Text>
          </div>
          <AdminButtonLink sentiment="accented" to={paths.newUser}>
            <AddIcon aria-hidden /> New user
          </AdminButtonLink>
        </div>
        <div className={`${classBase}-toolbar`}>
          <Input
            bordered
            className={`${classBase}-search`}
            inputProps={{ "aria-label": "Find a user" }}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setSearchText(event.target.value)
            }
            placeholder="Find a user by name, username or email"
            startAdornment={<SearchIcon aria-hidden />}
            value={searchText}
          />
          <FormField className={`${classBase}-sort`} labelPlacement="left">
            <FormFieldLabel>Sort by</FormFieldLabel>
            <Dropdown<UserSort>
              bordered
              onSelectionChange={(_event: SyntheticEvent, [value]) => {
                if (value) setSort(value);
              }}
              selected={[sort]}
              valueToString={sortLabel}
            >
              {USER_SORT_OPTIONS.map(({ label, value }) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Dropdown>
          </FormField>
        </div>
        <ComboBox<string>
          bordered
          className={`${classBase}-applicationFilter`}
          inputProps={{ "aria-label": "Find a user by application" }}
          multiselect
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setApplicationText(event.target.value)
          }
          onSelectionChange={(_event: SyntheticEvent, names: string[]) => {
            setApplicationText("");
            setApplicationNames(names);
          }}
          placeholder="Find a user by application(s)"
          selected={applicationNames}
          truncate
          value={applicationText}
          valueToString={titleOf}
        >
          {options.map(({ application }) => (
            <Option key={application.name} value={application.name}>
              {application.title}
            </Option>
          ))}
        </ComboBox>
        <Text aria-live="polite" color="secondary" styleAs="label">
          {count.count === undefined
            ? formatCount(count)
            : plural(count.count, "user")}
          {chosen.length > 0
            ? ` · with access to ${chosen.map(({ title }) => title).join(" and ")}`
            : ""}
        </Text>
      </div>
      {searchFilter.error ? (
        <Banner status="error">
          <BannerContent role="alert">{searchFilter.error}</BannerContent>
        </Banner>
      ) : null}
      <UsersTable
        aria-label="Users"
        className={`vuuIdentityAdmin-tableCard ${classBase}-table`}
        filter={filter}
        firstAccessRoles={accessRoles}
        sort={sort}
      />
    </Card>
  );
};

/**
 * The module's only landing page: pick a workflow, application or user, and
 * open the one to change.
 */
export const OverviewPage = () => {
  const [params] = useSearchParams();
  const search = params.get(SEARCH_PARAM)?.trim() ?? "";
  const { error, model } = useApplicationModel();
  const globalIssues = model.issues.filter(
    ({ application }) => !application || !model.byName.has(application),
  );
  return (
    <section
      aria-label="Overview"
      className={`vuuIdentityAdmin-page ${classBase}`}
    >
      {error ? (
        <Banner status="error">
          <BannerContent role="alert">{error}</BannerContent>
        </Banner>
      ) : null}
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
      <div className={`${classBase}-panels`}>
        <ApplicationsPanel initialSearch={search} key={`apps:${search}`} />
        <UsersPanel initialSearch={search} key={`users:${search}`} />
      </div>
      <UnassignedCard />
    </section>
  );
};
