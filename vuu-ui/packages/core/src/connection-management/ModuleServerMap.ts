import type { RemoteModuleConnection } from "@vuu-ui/vuu-data-types";
import {
  isNestedModule,
  type RemoteModuleDescriptor,
} from "../RemoteModuleDescriptor";
import {
  forgetRemoteModuleConfig,
  loadRemoteModuleConfig,
  RemoteModuleConfigError,
  remoteModuleConfigUrl,
} from "../remote-module/remote-module-config";

export type ModuleId = RemoteModuleDescriptor["id"];

export type ModuleServerResolution =
  | { status: "loading" }
  | {
      status: "resolved";
      connectionId: string;
      /** Absent when the module uses the portal's own server. */
      connection?: RemoteModuleConnection;
    }
  | {
      status: "error";
      error: RemoteModuleConfigError;
      /** Epoch ms when the load failed. */
      failedAt: number;
    };

export interface ModuleServerMapOptions {
  forgetConfig?: typeof forgetRemoteModuleConfig;
  /**
   * Returns why a server can't be connected to, or `undefined` if it can.
   * A module whose server isn't usable resolves to an `error`.
   */
  getUnusableReason?: (
    connection: RemoteModuleConnection,
  ) => string | undefined;
  loadConfig?: typeof loadRemoteModuleConfig;
  modules: RemoteModuleDescriptor[];
  now?: () => number;
  portalConnectionId: string;
}

const LOADING: ModuleServerResolution = { status: "loading" };

/**
 * Maps each registered module to the Vuu server it uses, read from the
 * `config.json` the module publishes. Configs are loaded once, navigable
 * modules first in registry order, through the shared config cache that
 * `RemoteModule` also uses.
 */
export class ModuleServerMap {
  readonly #forgetConfig: typeof forgetRemoteModuleConfig;
  readonly #getUnusableReason: ModuleServerMapOptions["getUnusableReason"];
  readonly #listeners = new Set<() => void>();
  readonly #loadConfig: typeof loadRemoteModuleConfig;
  readonly #modules: Map<ModuleId, RemoteModuleDescriptor>;
  readonly #now: () => number;
  readonly #portalConnectionId: string;
  readonly #resolutions = new Map<ModuleId, ModuleServerResolution>();
  #active = false;
  #byConnection?: Map<string, ModuleId[]>;
  #generation = 0;
  #version = 0;

  constructor({
    forgetConfig = forgetRemoteModuleConfig,
    getUnusableReason,
    loadConfig = loadRemoteModuleConfig,
    modules,
    now = Date.now,
    portalConnectionId,
  }: ModuleServerMapOptions) {
    this.#forgetConfig = forgetConfig;
    this.#getUnusableReason = getUnusableReason;
    this.#loadConfig = loadConfig;
    this.#modules = new Map(modules.map((module) => [module.id, module]));
    this.#now = now;
    this.#portalConnectionId = portalConnectionId;
  }

  get portalConnectionId() {
    return this.#portalConnectionId;
  }

  get modules() {
    return [...this.#modules.values()];
  }

  /** Starts loading configs. Safe to call again after `stop`. */
  start() {
    if (this.#active) {
      return;
    }
    this.#active = true;
    this.#generation += 1;
    const ordered = [
      ...this.modules.filter((module) => !isNestedModule(module)),
      ...this.modules.filter(isNestedModule),
    ];
    for (const module of ordered) {
      if (this.#resolutions.get(module.id)?.status !== "resolved") {
        this.#load(module);
      }
    }
  }

  /** Ignores configs that arrive after this call. */
  stop() {
    this.#active = false;
    this.#generation += 1;
  }

  get(moduleId: ModuleId): ModuleServerResolution {
    return this.#resolutions.get(moduleId) ?? LOADING;
  }

  /** True once every module has resolved or failed. */
  get settled() {
    return [...this.#modules.keys()].every(
      (id) => this.get(id).status !== "loading",
    );
  }

  modulesFor(connectionId: string): ModuleId[] {
    if (!this.#byConnection) {
      this.#byConnection = new Map();
      for (const [moduleId, resolution] of this.#resolutions) {
        if (resolution.status === "resolved") {
          const ids = this.#byConnection.get(resolution.connectionId) ?? [];
          ids.push(moduleId);
          this.#byConnection.set(resolution.connectionId, ids);
        }
      }
    }
    return this.#byConnection.get(connectionId) ?? [];
  }

  /** Evicts a module's cached config and loads it again. */
  retry(moduleId: ModuleId) {
    const module = this.#modules.get(moduleId);
    if (!module) {
      return;
    }
    this.#forgetConfig(module.mfUrl);
    this.#set(moduleId, LOADING);
    if (this.#active) {
      this.#load(module);
    }
  }

  subscribe = (listener: () => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /** Changes whenever any resolution changes, for `useSyncExternalStore`. */
  getVersion = () => this.#version;

  #load(module: RemoteModuleDescriptor) {
    const generation = this.#generation;
    let pending: Promise<{ vuu?: RemoteModuleConnection }>;
    try {
      pending = this.#loadConfig(module.mfUrl);
    } catch (error) {
      pending = Promise.reject(error);
    }
    pending.then(
      ({ vuu }) => {
        if (generation === this.#generation) {
          this.#set(module.id, this.#resolve(module, vuu));
        }
      },
      (error: unknown) => {
        if (generation === this.#generation) {
          console.warn(`[ModuleServerMap] ${String(error)}`);
          this.#set(module.id, this.#failure(module, error));
        }
      },
    );
  }

  #resolve(
    module: RemoteModuleDescriptor,
    vuu?: RemoteModuleConnection,
  ): ModuleServerResolution {
    if (!vuu) {
      return { status: "resolved", connectionId: this.#portalConnectionId };
    }
    const reason = this.#getUnusableReason?.(vuu);
    if (reason) {
      return this.#failure(
        module,
        new RemoteModuleConfigError(
          remoteModuleConfigUrl(module.mfUrl),
          reason,
        ),
      );
    }
    return {
      status: "resolved",
      connectionId: vuu.connectionId,
      connection: vuu,
    };
  }

  #failure(
    module: RemoteModuleDescriptor,
    error: unknown,
  ): ModuleServerResolution {
    const url = remoteModuleConfigUrl(module.mfUrl);
    return {
      status: "error",
      error:
        error instanceof RemoteModuleConfigError
          ? error
          : new RemoteModuleConfigError(url, String(error), { cause: error }),
      failedAt: this.#now(),
    };
  }

  #set(moduleId: ModuleId, resolution: ModuleServerResolution) {
    if (this.#resolutions.get(moduleId) === resolution) {
      return;
    }
    if (resolution === LOADING) {
      this.#resolutions.delete(moduleId);
    } else {
      this.#resolutions.set(moduleId, resolution);
    }
    this.#byConnection = undefined;
    this.#version += 1;
    for (const listener of this.#listeners) {
      listener();
    }
  }
}
