import type { RemoteModuleDescriptor } from "../../src/RemoteModuleDescriptor";

export const testModule = (
  id: string,
  navLocation = `/${id}`,
): RemoteModuleDescriptor => ({
  accessRole: `${id}-access`,
  clientIdentifier: id,
  description: id,
  id,
  mfComponent: id,
  mfScope: id,
  mfUrl: `http://localhost:5010/${id}`,
  name: id,
  navLocation,
  path: `/${id}`,
  title: id,
  version: 1,
});
