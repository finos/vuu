import { Banner, BannerContent, Spinner } from "@salt-ds/core";
import cx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { ModuleGrid } from "../components/ModuleGrid";
import { ModuleTableView } from "../components/ModuleTableView";
import { ModuleToolbar } from "../components/ModuleToolbar";
import { ModuleCommands, PageHeader } from "../components/PageHeader";
import {
  type StatusFilter,
  matchesSearch,
  matchesStatus,
} from "../data/module-model";
import {
  STATUS_FILTERS,
  isStatusFilter,
  listModules,
  useModuleAdmin,
} from "../ModuleAdminContext";

const classBase = "vuuModuleAdmin";

export const ModulesPage = () => {
  const { error, listPrefs, loading, paths, setListPrefs, views } =
    useModuleAdmin();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [scrolled, setScrolled] = useState(false);
  const param = params.get("status");
  const status: StatusFilter = isStatusFilter(param) ? param : "all";
  const prefs = { ...listPrefs, status };

  // Remember the filter, so the details pager and breadcrumb can follow it.
  useEffect(() => {
    if (listPrefs.status !== status) setListPrefs({ status });
  }, [listPrefs.status, setListPrefs, status]);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        STATUS_FILTERS.map((key) => [
          key,
          views.filter(
            (module) =>
              matchesSearch(module, listPrefs.filter) &&
              matchesStatus(module, key),
          ).length,
        ]),
      ) as Record<StatusFilter, number>,
    [listPrefs.filter, views],
  );
  const groups = useMemo(
    () => listModules(views, { ...listPrefs, status }),
    [listPrefs, status, views],
  );
  const visible = groups.reduce((n, { modules }) => n + modules.length, 0);

  const setStatus = (value: StatusFilter) =>
    setParams(value === "all" ? {} : { status: value }, { replace: true });
  const openCreate = () => navigate(paths.newModule());

  const renderBody = () => {
    if (loading) {
      return (
        <div className={`${classBase}-loading`}>
          <Spinner aria-label="Loading modules" />
        </div>
      );
    }
    if (visible === 0) {
      return (
        <EmptyState
          filtered={views.length > 0}
          onClearFilters={() => {
            setListPrefs({ filter: "" });
            setStatus("all");
          }}
          onCreate={openCreate}
        />
      );
    }
    if (prefs.view === "table") return <ModuleTableView groups={groups} />;
    return <ModuleGrid groups={groups} onCreate={openCreate} />;
  };

  return (
    <div
      className={cx(`${classBase}-page`, `${classBase}-page-sticky`)}
      onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 0)}
    >
      <div
        className={cx(`${classBase}-stickyHeader`, {
          [`${classBase}-stickyHeader-scrolled`]: scrolled,
        })}
      >
        <PageHeader
          description="Select a module to see and edit its full configuration."
          title="Modules"
        >
          <ModuleCommands />
        </PageHeader>
        {error ? (
          <Banner status="error">
            <BannerContent>
              Module discovery is unavailable: {error}
            </BannerContent>
          </Banner>
        ) : null}
        {views.length > 0 ? (
          <ModuleToolbar
            counts={counts}
            filter={prefs.filter}
            groupBy={prefs.groupBy}
            onFilterChange={(filter) => setListPrefs({ filter })}
            onGroupByChange={(groupBy) => setListPrefs({ groupBy })}
            onSortByChange={(sortBy) => setListPrefs({ sortBy })}
            onStatusChange={setStatus}
            onViewChange={(view) => setListPrefs({ view })}
            sortBy={prefs.sortBy}
            status={status}
            view={prefs.view}
          />
        ) : null}
      </div>
      <div className={`${classBase}-pageBody`}>{renderBody()}</div>
    </div>
  );
};
