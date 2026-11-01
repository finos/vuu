import {
  LocalWorkspacePersistenceService,
  RemoteWorkspacePersistenceService,
  type WorkspacePersistenceService,
} from "@vuu-ui/vuu-shell";
import type { DynamicFeatureDescriptor } from "@vuu-ui/vuu-utils";

interface WorkspacePersistenceBaseConfig {
  readonly applicationId: string;
  readonly namespace: string;
}

export interface LocalWorkspacePersistenceConfig
  extends WorkspacePersistenceBaseConfig {
  readonly type: "local";
}

export interface RemoteWorkspacePersistenceConfig
  extends WorkspacePersistenceBaseConfig {
  readonly auth?: {
    readonly credentials?: RequestCredentials;
    readonly headers?: Readonly<Record<string, string>>;
  };
  readonly baseUrl: string;
  readonly type: "remote";
}

export type WorkspacePersistenceConfig =
  | LocalWorkspacePersistenceConfig
  | RemoteWorkspacePersistenceConfig;

export type AppFeatureDescriptor = Partial<DynamicFeatureDescriptor> & {
  readonly featureProps?: { readonly vuuTables?: unknown };
  readonly leftNavLocation?: "vuu-features" | "vuu-tables";
  readonly name: string;
  readonly title: string;
  readonly url?: string;
};

export interface AppConfig {
  readonly features?: Record<string, AppFeatureDescriptor>;
  readonly ssl: boolean;
  readonly websocketUrl?: string;
  readonly workspacePersistence?: WorkspacePersistenceConfig;
}

export interface WorkspacePersistenceDependencies {
  readonly fetch?: typeof fetch;
  readonly getIdentityToken?: () => Promise<string>;
  readonly storage?: Storage;
}

export const defaultWorkspacePersistence: LocalWorkspacePersistenceConfig = {
  applicationId: "app-vuu-example",
  namespace: "vuu.sample-apps",
  type: "local",
};

export const createWorkspacePersistenceService = (
  config: WorkspacePersistenceConfig,
  userId: string,
  dependencies: WorkspacePersistenceDependencies = {},
): WorkspacePersistenceService => {
  const scope = {
    applicationId: config.applicationId,
    applicationNamespace: config.namespace,
    userId,
  };
  if (config.type === "local") {
    return new LocalWorkspacePersistenceService(scope, dependencies.storage);
  }

  return new RemoteWorkspacePersistenceService(scope, {
    baseUrl: config.baseUrl,
    fetch: dependencies.fetch,
    requestInitProvider: async () => {
      const token = await dependencies.getIdentityToken?.();
      return {
        credentials: config.auth?.credentials,
        headers: {
          ...config.auth?.headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      };
    },
  });
};
