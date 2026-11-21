import {
  Banner,
  BannerContent,
  Button,
  Input,
  Spinner,
  Tab,
  TabBar,
  TabList,
  Tabs,
  TabTrigger,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import { NotificationsProvider } from "@vuu-ui/vuu-notifications";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import type { ChangeEvent, SyntheticEvent } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { isStatusFilter } from "./data/module-model";
import {
  ModuleAdminProvider,
  useModuleAdmin,
  useModuleBase,
} from "./ModuleAdminContext";
import { MenuPage } from "./pages/MenuPage";
import { ModulesPage } from "./pages/ModulesPage";
import "./themeFallbacks.css";
import "./ModuleAdmin.css";

const classBase = "vuuModuleAdmin";

type View = "modules" | "menu";

const ViewTabs = () => {
  const { counts, paths } = useModuleAdmin();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const view: View =
    pathname === paths.menu || pathname.startsWith(`${paths.menu}/`)
      ? "menu"
      : "modules";
  return (
    <Tabs
      onChange={(_event, value) =>
        navigate(value === "menu" ? paths.menu : paths.modules)
      }
      value={view}
    >
      <TabBar className={`${classBase}-tabs`}>
        <TabList aria-label="Module Admin views">
          <Tab value="modules">
            <TabTrigger>
              Modules{" "}
              <span className={`${classBase}-count`}>{counts.total}</span>
            </TabTrigger>
          </Tab>
          <Tab value="menu">
            <TabTrigger>Menu</TabTrigger>
          </Tab>
        </TabList>
      </TabBar>
    </Tabs>
  );
};

const FilterInput = () => {
  const { filter, setFilter } = useModuleAdmin();
  return (
    <Input
      aria-label="Filter modules"
      bordered
      className={`${classBase}-filter`}
      endAdornment={
        filter ? (
          <Button
            appearance="transparent"
            aria-label="Clear filter"
            onClick={() => setFilter("")}
          >
            <Icon name="close" />
          </Button>
        ) : null
      }
      inputProps={{
        onKeyDown: (event) => {
          if (event.key === "Escape") setFilter("");
        },
        placeholder: "Filter title, name, route, role",
      }}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        setFilter(event.target.value)
      }
      startAdornment={<Icon name="search" />}
      value={filter}
    />
  );
};

const StatusToggle = () => {
  const { counts, setStatus, status } = useModuleAdmin();
  return (
    <ToggleButtonGroup
      aria-label="Show modules"
      className={`${classBase}-status`}
      onChange={(event: SyntheticEvent<HTMLButtonElement>) => {
        const { value } = event.currentTarget;
        if (isStatusFilter(value)) setStatus(value);
      }}
      value={status}
    >
      <ToggleButton value="all">
        All <span className={`${classBase}-toggleCount`}>{counts.total}</span>
      </ToggleButton>
      <ToggleButton value="enabled">
        Enabled{" "}
        <span className={`${classBase}-toggleCount`}>{counts.enabled}</span>
      </ToggleButton>
      <ToggleButton value="disabled">
        Disabled{" "}
        <span className={`${classBase}-toggleCount`}>{counts.disabled}</span>
      </ToggleButton>
      <ToggleButton value="attention">
        <Icon name="warn-triangle" /> Issues{" "}
        <span className={`${classBase}-toggleCount`}>{counts.attention}</span>
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

const Toolbar = () => (
  <div className={`${classBase}-toolbar`}>
    <ViewTabs />
    <FilterInput />
    <StatusToggle />
  </div>
);

const Content = () => {
  const { error, loading, views } = useModuleAdmin();
  if (error) {
    return (
      <div className={`${classBase}-message`}>
        <Banner status="error">
          <BannerContent>Could not load modules: {error}</BannerContent>
        </Banner>
      </div>
    );
  }
  if (loading && views.length === 0) {
    return (
      <div className={`${classBase}-message`}>
        <Spinner aria-label="Loading modules" size="small" />
      </div>
    );
  }
  return <Outlet />;
};

/** The name the portal nav uses for this remote too. */
const MODULE_ADMIN_TITLE = "Module Config Viewer";

const ModuleAdminLayout = () => (
  <div className={classBase}>
    <header className={`${classBase}-header`}>
      <h1 className={`${classBase}-title`}>{MODULE_ADMIN_TITLE}</h1>
    </header>
    <Toolbar />
    <main className={`${classBase}-content`}>
      <Content />
    </main>
  </div>
);

const ModuleAdmin = () => {
  const base = useModuleBase();
  const modules = `${base}/modules`;
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
          <Route index element={<Navigate replace to={modules} />} />
          <Route path="modules" element={<ModulesPage />} />
          <Route path="modules/:name" element={<ModulesPage />} />
          <Route path="menu" element={<MenuPage />} />
          {/* Views of the earlier, editable Module Admin. */}
          <Route path="overview" element={<Navigate replace to={modules} />} />
          <Route
            path="modules/new"
            element={<Navigate replace to={modules} />}
          />
          <Route path="modules/:name/edit" element={<EditRedirect />} />
          <Route path="*" element={<Navigate replace to={modules} />} />
        </Route>
      </Routes>
    </NotificationsProvider>
  );
};

/** `modules/:name/edit` shows the module, which can't be edited here. */
const EditRedirect = () => {
  const { pathname } = useLocation();
  return <Navigate replace to={pathname.replace(/\/edit\/?$/, "")} />;
};

export default ModuleAdmin;
