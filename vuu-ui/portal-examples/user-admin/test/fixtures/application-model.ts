import {
  buildApplicationModel,
  deriveApplications,
} from "../../src/data/applications";

/**
 * Two applications: Basket Trading, with a read group (access + viewer) and
 * a trade group missing the access role; and User Admin, with one group.
 * `legacy-users` matches no application.
 */
const descriptors = [
  {
    accessRole: "basket-trading-access",
    clientIdentifier: "vuu-basket-trading",
    name: "basket-trading",
    title: "Basket Trading",
  },
  {
    accessRole: "user-admin-access",
    clientIdentifier: "vuu-user-admin",
    name: "user-admin",
    title: "User Admin",
  },
];
export const remoteModules = descriptors.map((descriptor, id) => ({
  ...descriptor,
  description: "",
  id,
  mfComponent: "Module",
  mfScope: descriptor.name,
  mfUrl: "http://localhost",
  navLocation: `/Apps/${descriptor.title}`,
  path: `/${descriptor.name}`,
  version: 1,
}));
const { applications } = deriveApplications(descriptors);
export const model = buildApplicationModel({
  applications,
  clients: [
    { client_id: "c-portal", client_identifier: "vuu-portal" },
    { client_id: "c-basket", client_identifier: "vuu-basket-trading" },
    { client_id: "c-admin", client_identifier: "vuu-user-admin" },
  ],
  groupRoles: [
    { group_id: "g-read", role_id: "r-basket-access" },
    { group_id: "g-read", role_id: "r-basket-viewer" },
    { group_id: "g-trade", role_id: "r-basket-trader" },
    { group_id: "g-admin", role_id: "r-admin-access" },
  ],
  groups: [
    { group_id: "g-read", group_path: "/basket-trading-read", user_count: 2 },
    { group_id: "g-trade", group_path: "/basket-trading-trade", user_count: 1 },
    { group_id: "g-admin", group_path: "/user-admin-all", user_count: 1 },
    { group_id: "g-legacy", group_path: "/legacy-users", user_count: 0 },
  ],
  roles: [
    {
      client_identifier: "vuu-portal",
      role_id: "r-basket-access",
      role_name: "basket-trading-access",
    },
    {
      client_identifier: "vuu-portal",
      role_id: "r-admin-access",
      role_name: "user-admin-access",
    },
    {
      client_identifier: "vuu-basket-trading",
      role_id: "r-basket-viewer",
      role_name: "viewer",
    },
    {
      client_identifier: "vuu-basket-trading",
      role_id: "r-basket-trader",
      role_name: "trader",
    },
  ],
});
