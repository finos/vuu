import {
  Banner,
  BannerContent,
  Button,
  Card,
  Dropdown,
  H3,
  Option,
  Text,
} from "@salt-ds/core";
import { AddIcon, AddUserIcon, AppSwitcherIcon } from "@salt-ds/icons";
import { type SyntheticEvent, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AdminButtonLink,
  AdminLink,
  IconTile,
  PageHeader,
} from "../../components/admin-ui/AdminUi";
import { ApplicationCard } from "../../components/ApplicationCard";
import { UsersTable } from "../../components/UsersTable";
import type { ApplicationDetails } from "../../data/applications";
import { useAdminPaths } from "../../data/useAdminPaths";
import { userSearchFilter } from "../../data/useApplicationUsers";
import { useApplicationModel } from "../../data/useApplicationModel";
import { SEARCH_PARAM } from "../../UserAdmin";

import "./OverviewPage.css";

const classBase = "vuuAdminOverview";

const ApplicationStart = () => {
  const { loading, model } = useApplicationModel();
  const navigate = useNavigate();
  const paths = useAdminPaths();
  const [selected, setSelected] = useState<ApplicationDetails>();
  return (
    <Card className={`${classBase}-start`}>
      <IconTile size="large">
        <AppSwitcherIcon aria-hidden size={1.5} />
      </IconTile>
      <div className={`${classBase}-startBody`}>
        <H3>Set up an application</H3>
        <Text color="secondary">
          Define its groups and roles, then grant users access and put them in
          the right groups, one at a time or in batches.
        </Text>
        <div className="vuuAdminUi-actions">
          <Dropdown<ApplicationDetails>
            aria-label="Application"
            bordered
            className={`${classBase}-picker`}
            disabled={loading}
            onSelectionChange={(_event: SyntheticEvent, [entry]) =>
              setSelected(entry)
            }
            placeholder="Choose an application"
            value={selected?.application.title ?? ""}
          >
            {model.applications.map((entry) => (
              <Option key={entry.application.name} value={entry}>
                {entry.application.title}
              </Option>
            ))}
          </Dropdown>
          <Button
            disabled={!selected}
            onClick={() => {
              if (selected) {
                navigate(paths.application(selected.application.name));
              }
            }}
            sentiment="accented"
          >
            Open
          </Button>
        </div>
      </div>
    </Card>
  );
};

const UserStart = () => {
  const paths = useAdminPaths();
  return (
    <Card className={`${classBase}-start`}>
      <IconTile size="large">
        <AddUserIcon aria-hidden size={1.5} />
      </IconTile>
      <div className={`${classBase}-startBody`}>
        <H3>Set up a user</H3>
        <Text color="secondary">
          Create a user, or find one, and give them access to applications with
          the groups they need in each.
        </Text>
        <div className="vuuAdminUi-actions">
          <AdminButtonLink sentiment="accented" to={paths.newUser}>
            <AddIcon aria-hidden /> New user
          </AdminButtonLink>
          <AdminButtonLink to={paths.users}>Find a user</AdminButtonLink>
        </div>
      </div>
    </Card>
  );
};

const ApplicationCards = ({
  applications,
  title,
}: {
  applications: readonly ApplicationDetails[];
  title: string;
}) => {
  const paths = useAdminPaths();
  return (
    <section aria-label={title} className={`${classBase}-section`}>
      <div className={`${classBase}-sectionHeader`}>
        <H3>{title}</H3>
        <AdminLink to={paths.applications}>All applications</AdminLink>
      </div>
      {applications.length === 0 ? (
        <Text color="secondary">No matching applications.</Text>
      ) : (
        <div className={`${classBase}-cards`}>
          {applications.map((entry) => (
            <ApplicationCard entry={entry} key={entry.application.name} />
          ))}
        </div>
      )}
    </section>
  );
};

const SearchResults = ({ search }: { search: string }) => {
  const { model } = useApplicationModel();
  const needle = search.toLocaleLowerCase();
  const applications = model.applications.filter(({ application }) =>
    [application.title, application.name, application.accessRole].some(
      (value) => value.toLocaleLowerCase().includes(needle),
    ),
  );
  const { error, filter } = useMemo(() => userSearchFilter(search), [search]);
  return (
    <>
      <ApplicationCards
        applications={applications}
        title={`Applications matching "${search}"`}
      />
      <section aria-label="Matching users" className={`${classBase}-section`}>
        <H3>Users matching "{search}"</H3>
        {error ? <p role="alert">{error}</p> : null}
        <UsersTable
          aria-label="Users"
          className={`vuuIdentityAdmin-tableCard ${classBase}-users`}
          filter={filter}
        />
      </section>
    </>
  );
};

export const OverviewPage = () => {
  const [params] = useSearchParams();
  const search = params.get(SEARCH_PARAM)?.trim() ?? "";
  const { error, loading, model } = useApplicationModel();
  const paths = useAdminPaths();
  const issueCount = model.issues.length;
  return (
    <section className={`vuuIdentityAdmin-page ${classBase}`}>
      <PageHeader
        description="Start from an application or from a user. Groups and roles are set up inside each application."
        title="Overview"
      />
      {error ? (
        <Banner status="error">
          <BannerContent role="alert">{error}</BannerContent>
        </Banner>
      ) : null}
      {search ? (
        <SearchResults key={search} search={search} />
      ) : (
        <>
          <div className={`${classBase}-starts`}>
            <ApplicationStart />
            <UserStart />
          </div>
          {!loading && issueCount > 0 ? (
            <Banner status="warning">
              <BannerContent role="status">
                {issueCount} configuration{" "}
                {issueCount === 1 ? "issue" : "issues"} found. Open an
                application to review its checks.
              </BannerContent>
            </Banner>
          ) : null}
          {model.applications.length === 0 && !loading ? (
            <p className="vuuIdentityAdmin-empty">
              No applications are registered with the portal.
            </p>
          ) : (
            <ApplicationCards
              applications={model.applications}
              title="Applications"
            />
          )}
          <section
            aria-label="Recently changed users"
            className={`${classBase}-section`}
          >
            <div className={`${classBase}-sectionHeader`}>
              <H3>Recently changed users</H3>
              <AdminLink to={paths.users}>All users</AdminLink>
            </div>
            <UsersTable
              aria-label="Users"
              className={`vuuIdentityAdmin-tableCard ${classBase}-users`}
              recent
            />
          </section>
        </>
      )}
    </section>
  );
};
