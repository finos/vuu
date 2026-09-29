import {
  AuthenticationProvider,
  type PortalModuleRegistry,
} from "@vuu-ui/core";
import {
  NavContainer,
  PortalAppSwitcher,
  PortalHeader,
  PortalLandingPage,
  PortalLogo,
  PortalShell,
} from "@vuu-ui/core/portal";
import { VuuLogo } from "@vuu-ui/vuu-icons";
import { MemoryRouter } from "react-router-dom";
import { dashBoardIcon, ordersIcon, positionsIcon } from "./portal-icons";

const remoteModules = {
  modules: [
    {
      clientIdentifier: "vuu-user-admin",
      description: "User administration",
      id: "user-admin",
      navLocation: "/UserAdmin",
      navIconUrl: dashBoardIcon,
      accessRole: "user-admin-access",
      mfComponent: "UserAdmin",
      mfScope: "userAdmin",
      mfUrl: "http://localhost:5001/user-admin/mf-manifest.json",
      name: "user-admin",
      path: "/administration/users",
      title: "User Admin",
      version: 1,
    },
    {
      clientIdentifier: "vuu-module-admin",
      description: "Module administration",
      id: "module-admin",
      navLocation: "/ModuleAdmin",
      navIconUrl: ordersIcon,
      accessRole: "module-admin-access",
      mfComponent: "ModuleAdmin",
      mfScope: "moduleAdmin",
      mfUrl: "http://localhost:5001/module-admin/mf-manifest.json",
      name: "module-admin",
      path: "/administration/modules",
      title: "Module Admin",
      version: 1,
    },
    {
      clientIdentifier: "vuu-basket-trading",
      description: "Basket trading",
      id: "basket-trading",
      navLocation: "/BasketTrading",
      navIconUrl: positionsIcon,
      accessRole: "basket-trading-access",
      mfComponent: "BasketTrading",
      mfScope: "basketTrading",
      mfUrl: "http://localhost:5001/basket-trading/mf-manifest.json",
      name: "basket-trading",
      path: "/trading/baskets",
      title: "Basket Trading",
      version: 1,
    },
  ],
} satisfies PortalModuleRegistry;

export const PortalShellWithNavContainer = () => (
  <AuthenticationProvider mode="local" registry={remoteModules}>
    <PortalShell
      id="portal-demo"
      remoteModules={remoteModules.modules}
      title="Portal Demo"
    >
      <NavContainer>
        <PortalLogo alt="Portal home" style={{ gridArea: "logo" }}>
          <VuuLogo size={30} />
        </PortalLogo>
        <PortalAppSwitcher
          displayStyle="icon-only"
          remoteModules={remoteModules.modules}
        />
      </NavContainer>
      <PortalLandingPage>
        <main>
          <h1>Welcome to Portal Demo</h1>
          <p>Select an application to get started.</p>
        </main>
      </PortalLandingPage>
      <PortalHeader />
    </PortalShell>
  </AuthenticationProvider>
);

export const PortalShellWithNavLandingPage = () => (
  <AuthenticationProvider mode="local" registry={remoteModules}>
    <PortalShell
      id="portal-demo"
      remoteModules={remoteModules.modules}
      title="Portal Demo"
    >
      <NavContainer>
        <PortalLogo alt="Portal home" style={{ gridArea: "logo" }}>
          <VuuLogo size={30} />
        </PortalLogo>
        <PortalAppSwitcher
          displayStyle="icon-only"
          remoteModules={remoteModules.modules}
        />
      </NavContainer>
      <PortalLandingPage>
        <NavContainer mode="dashboard">
          <PortalLogo alt="Portal home" style={{ gridArea: "logo" }}>
            <VuuLogo size={50} />
          </PortalLogo>
          <PortalAppSwitcher
            displayStyle="dashboard"
            remoteModules={remoteModules.modules}
          />
        </NavContainer>
      </PortalLandingPage>
      <PortalHeader />
    </PortalShell>
  </AuthenticationProvider>
);

export const NavContainerAsContent = () => (
  <MemoryRouter>
    <NavContainer mode="dashboard">
      <PortalLogo alt="Portal home" style={{ gridArea: "logo" }}>
        <VuuLogo size={60} />
      </PortalLogo>
      <PortalAppSwitcher
        displayStyle="dashboard"
        remoteModules={remoteModules.modules}
      />
    </NavContainer>
  </MemoryRouter>
);
