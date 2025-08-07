import { VuuModule } from "./VuuModule";

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

  #modules = new Map<string, VuuModule>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register(module: VuuModule<any>) {
    this.#modules.set(module.name, module);
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
