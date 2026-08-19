import type { VuuModule } from "./VuuModule";

// biome-ignore lint/suspicious/noExplicitAny: Modules use different table-name unions.
type RegisteredVuuModule = VuuModule<any>;

class ModuleContainer {
  private constructor() {
    //  empty constructor is all we need
  }
  static #instance: ModuleContainer;

  public static get instance(): ModuleContainer {
    if (!ModuleContainer.#instance) {
      ModuleContainer.#instance = new ModuleContainer();
    }
    return ModuleContainer.#instance;
  }

  #modules = new Map<string, RegisteredVuuModule>();

  register(module: RegisteredVuuModule) {
    this.#modules.set(module.name, module);
  }

  has(name: string) {
    return this.#modules.has(name);
  }

  get(name: string) {
    const module = this.#modules.get(name);
    if (module) {
      return module;
    }
    throw Error(`[ModuleFactory] module ${name} not found`);
  }

  get moduleNames() {
    return this.#modules.keys();
  }
}

export default ModuleContainer.instance;

export const ensureVuuModule = <T extends RegisteredVuuModule>(module: T) => {
  if (!ModuleContainer.instance.has(module.name)) {
    ModuleContainer.instance.register(module);
  }
  return module;
};
