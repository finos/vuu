import { RpcService, VuuModule, VuuModuleConstructorProps } from "../VuuModule";
import { SimulTableName } from "./simul-schemas";

/**
 * This is an example of how we might extend the built-in VuuModule to
 * implement a module-specific service in such a way that it can invoke
 * methods on the VuuModule.
 */
export class SimulModule extends VuuModule<SimulTableName> {
  constructor(props: VuuModuleConstructorProps) {
    super(props);
  }

  getServices(tableName: SimulTableName) {
    return this.#services.concat(super.getServices(tableName));
  }

  #services: RpcService[] = [];
}
