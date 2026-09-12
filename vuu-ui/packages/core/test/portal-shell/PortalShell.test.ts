import type { RemoteModuleDescriptor } from "../../src/RemoteModuleDescriptor";
import {
  getPortalRemoteModuleProps,
  type PortalRemoteModuleProps,
} from "../../src/portal-shell/PortalShell";
import { describe, expect, it } from "vitest";

const modules = [
  {
    clientIdentifier: "vuu-user-admin",
    description: "Manage users",
    id: 1,
    location: "/Admin/Users",
    loginRole: "user-admin-login",
    mfComponent: "UserAdmin",
    mfScope: "userAdmin",
    mfUrl: "http://localhost:5007",
    name: "user-admin",
    path: "/users/admin",
    title: "Manage users",
    version: 1,
  },
] satisfies RemoteModuleDescriptor[];

describe("PortalShell remote contract", () => {
  it("passes the complete module registry through typed remote props", () => {
    const props: PortalRemoteModuleProps = getPortalRemoteModuleProps(modules);

    expect(props).toEqual({ remoteModules: modules });
    expect(props.remoteModules[0]).toMatchObject({
      clientIdentifier: "vuu-user-admin",
      loginRole: "user-admin-login",
    });
  });
});
