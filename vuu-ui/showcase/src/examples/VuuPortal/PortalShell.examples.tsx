import {
  NavContainer,
  PortalAppSwitcher,
  PortalHeader,
  PortalLogo,
  PortalShell,
} from "@vuu-ui/core/portal";
import { VuuLogo } from "@vuu-ui/vuu-icons";
import {
  AuthenticationProvider,
  type PortalModuleRegistry,
} from "@vuu-ui/core";

const remoteModules = {
  modules: [
    {
      clientIdentifier: "vuu-user-admin",
      description: "User administration",
      id: "user-admin",
      navLocation: "/UserAdmin",
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

export const SingleLevelAppSwitcher = () => (
  <AuthenticationProvider mode="local" registry={remoteModules}>
    <PortalShell
      id="portal-demo"
      remoteModules={remoteModules.modules}
      title="Portal Demo"
    >
      <NavContainer>
        <PortalLogo alt="Portal home" style={{ gridArea: "logo" }}>
          <VuuLogo />
        </PortalLogo>
        <PortalAppSwitcher
          displayStyle="icon-only"
          remoteModules={remoteModules.modules}
        />
      </NavContainer>
      <PortalHeader />
    </PortalShell>
  </AuthenticationProvider>
);
