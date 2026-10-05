import {
  Button,
  Input,
  Text,
  VerticalNavigation,
  VerticalNavigationItem,
  VerticalNavigationItemContent,
  VerticalNavigationItemLabel,
  VerticalNavigationItemTrigger,
} from "@salt-ds/core";
import {
  CloseIcon,
  GridIcon,
  HomeIcon,
  LayersIcon,
  SearchIcon,
  TearOutIcon,
  TreeIcon,
  WarningIcon,
} from "@salt-ds/icons";
import { PortalLink } from "@vuu-ui/core/portal";
import { NotificationsProvider } from "@vuu-ui/vuu-notifications";
import cx from "clsx";
import { type ReactNode, useState } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { inputValue } from "./components/ModuleForm";
import {
  ModuleAdminProvider,
  useModuleAdmin,
  useModuleBase,
} from "./ModuleAdminContext";
import { MenuPage } from "./pages/MenuPage";
import { ModuleDetailsPage } from "./pages/ModuleDetailsPage";
import { ModulesPage } from "./pages/ModulesPage";
import { NewModulePage } from "./pages/NewModulePage";
import { OverviewPage, SEARCH_PARAM } from "./pages/OverviewPage";
import "./themeFallbacks.css";
import "./ModuleAdmin.css";

const classBase = "vuuModuleAdmin";

/** User Admin's route in the portal. */
const USER_ADMIN_PATH = "/administration/users";

export { duplicateConfig } from "./ModuleAdminContext";

const NavItem = ({
  active,
  badge,
  icon,
  label,
  to,
  tone,
}: {
  active: boolean;
  badge?: number;
  icon: ReactNode;
  label: string;
  to: string;
  tone?: "warning";
}) => (
  <VerticalNavigationItem active={active}>
    <VerticalNavigationItemContent>
      <VerticalNavigationItemTrigger render={<PortalLink end to={to} />}>
        {icon}
        <VerticalNavigationItemLabel>{label}</VerticalNavigationItemLabel>
        {badge !== undefined ? (
          <span
            className={cx(`${classBase}-navBadge`, {
              [`${classBase}-navBadge-warning`]: tone === "warning",
            })}
          >
            {badge}
          </span>
        ) : null}
      </VerticalNavigationItemTrigger>
    </VerticalNavigationItemContent>
  </VerticalNavigationItem>
);

const Navigation = () => {
  const { kpis, paths } = useModuleAdmin();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const within = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);
  const attention =
    pathname === `${paths.base}/modules` &&
    params.get("status") === "attention";
  return (
    <nav aria-label="Module administration" className={`${classBase}-nav`}>
      <VerticalNavigation appearance="indicator">
        <NavItem
          active={within(`${paths.base}/overview`)}
          icon={<HomeIcon aria-hidden />}
          label="Overview"
          to={paths.overview()}
        />
        <NavItem
          active={within(`${paths.base}/modules`) && !attention}
          badge={kpis.total}
          icon={<GridIcon aria-hidden />}
          label="Modules"
          to={paths.modules()}
        />
        <NavItem
          active={within(paths.menu)}
          icon={<TreeIcon aria-hidden />}
          label="Menu structure"
          to={paths.menu}
        />
      </VerticalNavigation>
      {kpis.modulesWithIssues > 0 ? (
        <>
          <hr className={`${classBase}-navDivider`} />
          <VerticalNavigation appearance="indicator">
            <NavItem
              active={attention}
              badge={kpis.modulesWithIssues}
              icon={<WarningIcon aria-hidden />}
              label="Needs attention"
              to={paths.modules("attention")}
              tone="warning"
            />
          </VerticalNavigation>
        </>
      ) : null}
      <span className={`${classBase}-spacer`} />
      <PortalLink
        className={`${classBase}-navFooterLink`}
        routeScope="portal"
        to={USER_ADMIN_PATH}
      >
        <TearOutIcon aria-hidden /> Open User Admin
      </PortalLink>
    </nav>
  );
};

/** Searches from any page; matches are listed on the Overview page. */
const HeaderSearch = () => {
  const { paths } = useModuleAdmin();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const onOverview = pathname === paths.overview();
  const committed = onOverview ? (params.get(SEARCH_PARAM) ?? "") : "";
  const [value, setValue] = useState(committed);
  const [synced, setSynced] = useState(committed);
  if (committed !== synced) {
    setSynced(committed);
    setValue(committed);
  }

  const search = (term: string) => {
    setValue(term);
    if (term.trim() || onOverview) {
      navigate(paths.overview(term.trim()), { replace: onOverview });
    }
  };

  return (
    <Input
      aria-label="Search modules"
      bordered
      className={`${classBase}-search`}
      endAdornment={
        value ? (
          <Button
            appearance="transparent"
            aria-label="Clear search"
            onClick={() => search("")}
          >
            <CloseIcon aria-hidden />
          </Button>
        ) : null
      }
      inputProps={{
        onKeyDown: (event) => {
          if (event.key === "Escape") {
            search("");
          } else if (event.key === "Enter") {
            search(value);
          }
        },
        placeholder: "Search title, name, scope, route or role…",
      }}
      onChange={(event) => {
        const term = inputValue(event);
        // Once results are showing, refine them as the user types.
        if (onOverview && committed) search(term);
        else setValue(term);
      }}
      startAdornment={<SearchIcon aria-hidden />}
      value={value}
    />
  );
};

const ModuleAdminLayout = () => (
  <div className={classBase}>
    <header className={`${classBase}-appHeader`}>
      <span className={`${classBase}-brandIcon`}>
        <LayersIcon aria-hidden />
      </span>
      <strong className={`${classBase}-brandName`}>Module Admin</strong>
      <Text className={`${classBase}-brandTagline`} color="secondary">
        Remote modules registered with module discovery
      </Text>
      <span className={`${classBase}-spacer`} />
      <HeaderSearch />
    </header>
    <div className={`${classBase}-workspace`}>
      <Navigation />
      <main className={`${classBase}-content`}>
        <Outlet />
      </main>
    </div>
  </div>
);

const NotFound = () => {
  const { paths } = useModuleAdmin();
  return (
    <div className={`${classBase}-page`}>
      <p>
        Page not found.{" "}
        <PortalLink to={paths.overview()}>Go to Overview</PortalLink>
      </p>
    </div>
  );
};

const ModuleAdmin = () => {
  const base = useModuleBase();
  return (
    <NotificationsProvider>
      <Routes>
        <Route
          element={
            <ModuleAdminProvider base={base}>
              <ModuleAdminLayout />
            </ModuleAdminProvider>
          }
        >
          <Route index element={<Navigate replace to={`${base}/overview`} />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="modules" element={<ModulesPage />} />
          <Route path="modules/new" element={<NewModulePage />} />
          <Route path="modules/:name" element={<ModuleDetailsPage />} />
          <Route
            path="modules/:name/edit"
            element={<ModuleDetailsPage editing />}
          />
          <Route path="menu" element={<MenuPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </NotificationsProvider>
  );
};

export default ModuleAdmin;
