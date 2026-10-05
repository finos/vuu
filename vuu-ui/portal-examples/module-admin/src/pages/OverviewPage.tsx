import { Banner, BannerContent, Spinner, Text } from "@salt-ds/core";
import {
  ArrowRightIcon,
  ChevronRightIcon,
  GridIcon,
  InfoIcon,
  LinkedIcon,
  LockedIcon,
  MenuIcon,
  StopIcon,
  VisibleIcon,
  WarningIcon,
} from "@salt-ds/icons";
import { PortalLink } from "@vuu-ui/core/portal";
import cx from "clsx";
import type { ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { useModuleActions } from "../components/ModuleActions";
import { ModuleCommands, PageHeader } from "../components/PageHeader";
import {
  EnabledStatus,
  MenuLocation,
  NavIcon,
  RoleTag,
} from "../components/ui";
import {
  type ModuleView,
  issueLabel,
  matchesSearch,
  menuSections,
  plural,
  relativeTime,
  sortModules,
} from "../data/module-model";
import { useModuleAdmin } from "../ModuleAdminContext";

export const SEARCH_PARAM = "search";

const classBase = "vuuModuleAdmin";

const SummaryCard = ({
  detail,
  icon,
  label,
  to,
  tone,
  value,
}: {
  detail: ReactNode;
  icon: ReactNode;
  label: string;
  to: string;
  tone?: "accent" | "success" | "warning";
  value: ReactNode;
}) => (
  <PortalLink
    className={cx(
      `${classBase}-summary`,
      tone && `${classBase}-summary-${tone}`,
    )}
    to={to}
  >
    <span className={`${classBase}-summaryMain`}>
      <span className={`${classBase}-summaryIcon`}>{icon}</span>
      <span className={`${classBase}-summaryText`}>
        <span className={`${classBase}-summaryValue`}>{value}</span>
        <span className={`${classBase}-summaryLabel`}>{label}</span>
      </span>
      <ChevronRightIcon aria-hidden className={`${classBase}-summaryChevron`} />
    </span>
    <span className={`${classBase}-summaryDetail`}>{detail}</span>
  </PortalLink>
);

const Dot = ({ tone }: { tone: "success" | "neutral" | "error" }) => (
  <span
    aria-hidden
    className={cx(`${classBase}-dot`, `${classBase}-dot-${tone}`)}
  />
);

const enabledDetail = (views: readonly ModuleView[], checked: boolean) => {
  const enabled = views.filter(({ enabled }) => enabled);
  if (enabled.some(({ remote }) => remote?.status === "checking")) {
    return "Checking remotes…";
  }
  const failing = enabled.filter(({ issues }) =>
    issues.some(({ kind }) => kind === "remote"),
  );
  if (failing.length > 0) {
    return (
      <>
        <Dot tone="error" />
        {failing.length === 1
          ? `${failing[0].title} has a remote problem`
          : `${failing.length} remotes have problems`}
      </>
    );
  }
  if (!checked) return "Remote status not checked yet";
  return (
    <>
      <Dot tone="success" /> All enabled remotes reachable
    </>
  );
};

const attentionDetail = (views: readonly ModuleView[]) => {
  const labels = new Map<string, ReactNode>();
  for (const module of views) {
    for (const issue of module.issues) {
      const label = issueLabel(issue, module.remote);
      labels.set(
        label,
        issue.kind === "noAccessRole" ? (
          <LockedIcon aria-hidden />
        ) : (
          <WarningIcon aria-hidden />
        ),
      );
    }
  }
  if (labels.size === 0) return "Nothing needs attention";
  return [...labels].map(([label, icon]) => (
    <span className={`${classBase}-summaryIssue`} key={label}>
      {icon}
      {label[0].toUpperCase() + label.slice(1)}
    </span>
  ));
};

const AttentionBanner = () => {
  const { kpis, paths, views } = useModuleAdmin();
  const modules = views.filter(({ issues }) => issues.length > 0);
  if (modules.length === 0) return null;
  const [first] = modules;
  return (
    <Banner className={`${classBase}-attention`} status="warning">
      <BannerContent>
        <strong>
          {plural(modules.length, "module")}{" "}
          {modules.length === 1 ? "needs" : "need"} attention.
        </strong>{" "}
        {modules.length === 1
          ? `${first.title} has ${plural(first.issues.length, "configuration issue")}.`
          : `${plural(kpis.issues, "configuration issue")} across ${modules
              .map(({ title }) => title)
              .join(", ")}.`}
      </BannerContent>
      <PortalLink
        className={`${classBase}-bannerLink`}
        to={paths.modules("attention")}
      >
        Review <ArrowRightIcon aria-hidden />
      </PortalLink>
    </Banner>
  );
};

const Summary = () => {
  const { kpis, modules, paths, remoteChecks, views } = useModuleAdmin();
  const topLevel = views.filter(({ parent }) => !parent);
  const inMenu = topLevel.filter(({ location }) => location).length;
  const children = views.length - topLevel.length;
  const disabled = views.filter(({ enabled }) => !enabled);
  const sections = menuSections(modules);
  const portalConnection = views.filter(
    ({ vuuConnectionId }) => !vuuConnectionId,
  ).length;
  return (
    <section aria-label="Summary" className={`${classBase}-summaries`}>
      <SummaryCard
        detail={`${inMenu} in the portal menu · ${plural(children, "child module")}`}
        icon={<GridIcon aria-hidden />}
        label="Registered modules"
        to={paths.modules()}
        tone="accent"
        value={kpis.total}
      />
      <SummaryCard
        detail={enabledDetail(views, remoteChecks.lastCheckedAt !== undefined)}
        icon={<VisibleIcon aria-hidden />}
        label="Enabled"
        to={paths.modules("enabled")}
        tone="success"
        value={kpis.enabled}
      />
      <SummaryCard
        detail={
          disabled.length > 0 ? (
            <>
              <Dot tone="neutral" />
              {disabled.map(({ title }) => title).join(", ")}
            </>
          ) : (
            "Every module is enabled"
          )
        }
        icon={<StopIcon aria-hidden />}
        label="Disabled"
        to={paths.modules("disabled")}
        value={kpis.disabled}
      />
      <SummaryCard
        detail={attentionDetail(views)}
        icon={<WarningIcon aria-hidden />}
        label="Needs attention"
        to={paths.modules("attention")}
        tone={kpis.modulesWithIssues > 0 ? "warning" : undefined}
        value={
          <>
            {kpis.modulesWithIssues}
            {kpis.issues > 0 ? (
              <span className={`${classBase}-summaryAside`}>
                {kpis.modulesWithIssues === 1 ? " module" : " modules"} ·{" "}
                {plural(kpis.issues, "issue")}
              </span>
            ) : null}
          </>
        }
      />
      <SummaryCard
        detail={sections.length > 0 ? sections.join(" · ") : "No menu sections"}
        icon={<MenuIcon aria-hidden />}
        label="Menu sections"
        to={paths.menu}
        value={kpis.sections}
      />
      <SummaryCard
        detail={`${plural(portalConnection, "module")} ${portalConnection === 1 ? "uses" : "use"} the portal connection`}
        icon={<LinkedIcon aria-hidden />}
        label="Dedicated Vuu connections"
        to={paths.modules()}
        value={kpis.connections}
      />
    </section>
  );
};

const SearchResults = ({ search }: { search: string }) => {
  const { paths, views } = useModuleAdmin();
  const actions = useModuleActions();
  const results = sortModules(
    views.filter((module) => matchesSearch(module, search)),
    "menu",
  );
  return (
    <section aria-label="Search results" className={`${classBase}-results`}>
      <div className={`${classBase}-resultsHeader`}>
        <h2>
          {plural(results.length, "module")} matching “{search}”
        </h2>
        <span className={`${classBase}-spacer`} />
        <Text color="secondary" styleAs="label">
          Press Esc to clear
        </Text>
      </div>
      {results.length === 0 ? (
        <div className={`${classBase}-resultsEmpty`}>
          <Text color="secondary">No modules match this search.</Text>
          <PortalLink to={paths.overview()}>Clear search</PortalLink>
        </div>
      ) : (
        <table className="vuuModuleTable">
          <thead>
            <tr>
              <th>Module</th>
              <th>Status</th>
              <th>Menu</th>
              <th>Route</th>
              <th>Access role</th>
              <th>Issues</th>
            </tr>
          </thead>
          <tbody>
            {results.map((module) => (
              <tr
                className={cx({ "vuuModuleTable-disabled": !module.enabled })}
                key={module.id}
                onClick={() => actions.select(module)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") actions.select(module);
                }}
                tabIndex={0}
              >
                <td>
                  <span className="vuuModuleTable-module">
                    <NavIcon
                      name={module.name}
                      size="small"
                      url={module.navIconUrl}
                    />
                    <span>
                      <strong>{module.title}</strong>
                      <code>{module.name}</code>
                    </span>
                  </span>
                </td>
                <td>
                  <EnabledStatus enabled={module.enabled} />
                </td>
                <td>
                  <MenuLocation module={module} />
                </td>
                <td>
                  <code>{module.path || "–"}</code>
                </td>
                <td>
                  <RoleTag module={module} />
                </td>
                <td>
                  {module.issues.length > 0 ? (
                    <span className={`${classBase}-issueCount`}>
                      <WarningIcon aria-hidden />
                      {module.issues.length}
                    </span>
                  ) : (
                    <Text color="secondary">–</Text>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Text color="secondary" styleAs="label">
        Search matches title, name, scope, route, menu location, access role and
        Vuu connection.{" "}
        <PortalLink to={paths.modules()}>Browse all modules</PortalLink>
      </Text>
    </section>
  );
};

export const OverviewPage = () => {
  const { error, loading, paths, remoteChecks, views } = useModuleAdmin();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const search = params.get(SEARCH_PARAM)?.trim() ?? "";

  const renderBody = () => {
    if (loading) {
      return (
        <div className={`${classBase}-loading`}>
          <Spinner aria-label="Loading modules" />
        </div>
      );
    }
    if (search) return <SearchResults search={search} />;
    if (views.length === 0) {
      return (
        <EmptyState
          filtered={false}
          onClearFilters={() => undefined}
          onCreate={() => navigate(paths.newModule())}
        />
      );
    }
    return (
      <>
        <AttentionBanner />
        <Summary />
        <Text
          className={`${classBase}-checkedNote`}
          color="secondary"
          styleAs="label"
        >
          <InfoIcon aria-hidden />
          {remoteChecks.lastCheckedAt
            ? `Remote status checked from this browser · ${relativeTime(remoteChecks.lastCheckedAt)}`
            : "Remote status not checked yet"}
        </Text>
      </>
    );
  };

  return (
    <div className={`${classBase}-page`}>
      <PageHeader
        description="Remote modules registered with module discovery, and how they are loaded, secured and placed in the portal menu."
        title="Overview"
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
      {renderBody()}
    </div>
  );
};
