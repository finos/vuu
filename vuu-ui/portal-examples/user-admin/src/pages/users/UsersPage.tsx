import { Input } from "@salt-ds/core";
import { AddIcon, SearchIcon } from "@salt-ds/icons";
import type { Filter } from "@vuu-ui/vuu-filter-types";
import { type ChangeEvent, useDeferredValue, useMemo, useState } from "react";
import {
  AdminButtonLink,
  AdminToolbar,
  PageHeader,
  PageHeaderActions,
} from "../../components/admin-ui/AdminUi";
import { ApplicationFilter } from "../../components/ApplicationFilter";
import { UsersTable } from "../../components/UsersTable";
import { UNASSIGNED } from "../../data/applications";
import { useAdminPaths } from "../../data/useAdminPaths";
import { useApplicationModel } from "../../data/useApplicationModel";
import { userSearchFilter } from "../../data/useApplicationUsers";
import {
  useApplicationParam,
  userScopeFilter,
} from "../../data/useApplicationScope";

/** Every user. Open one to change their application access, or create one. */
export const UsersPage = () => {
  const paths = useAdminPaths();
  const { model } = useApplicationModel();
  const [application, setApplication] = useApplicationParam();
  const [searchText, setSearchText] = useState("");
  const deferredSearch = useDeferredValue(searchText);
  const knownApplication =
    application === UNASSIGNED || model.byName.has(application);

  const search = useMemo(
    () => userSearchFilter(deferredSearch),
    [deferredSearch],
  );
  const filter = useMemo<Filter | undefined>(() => {
    const filters: Filter[] = [];
    if (application && knownApplication) {
      filters.push(userScopeFilter(model, application));
    }
    if (search.filter) filters.push(search.filter);
    return filters.length > 1 ? { op: "and", filters } : filters[0];
  }, [application, knownApplication, model, search.filter]);

  return (
    <section className="vuuIdentityAdmin-page">
      <PageHeader
        description="Open a user to change the applications they can use, or create a new one."
        title="Users"
      >
        <PageHeaderActions>
          <AdminButtonLink sentiment="accented" to={paths.newUser}>
            <AddIcon aria-hidden /> New user
          </AdminButtonLink>
        </PageHeaderActions>
      </PageHeader>
      <AdminToolbar>
        <Input
          bordered
          className="vuuIdentityAdmin-searchInput"
          inputProps={{ "aria-label": "Filter users" }}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setSearchText(event.target.value)
          }
          placeholder="Filter by name, username or email"
          startAdornment={<SearchIcon aria-hidden />}
          value={searchText}
        />
        <ApplicationFilter
          noAccessLabel="No application access"
          onChange={setApplication}
          value={knownApplication ? application : ""}
        />
      </AdminToolbar>
      {search.error ? <p role="alert">{search.error}</p> : null}
      <UsersTable aria-label="Users" filter={filter} />
    </section>
  );
};
