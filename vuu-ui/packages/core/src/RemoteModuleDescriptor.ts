import type { RemoteModuleConnection } from "./auth";

export interface RemoteModuleDescriptor {
  description: string;
  id: string;
  location: string;
  name: string;
  /**
   * Module federation - the name of remote component to be imported
   */
  mfComponent: string;
  /**
   * Module federation - the identifier of remote module
   */
  mfScope: string;
  /**
   * Module federation - the url of remote module manifest
   */
  mfUrl: string;
  moduleRegistryUrl?: string;
  path: string;
  title: string;
  vuu?: RemoteModuleConnection;
  version: number;
}
