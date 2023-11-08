import { DataSource } from "@finos/vuu-data";
import basketModule from "./basket/basket-module";
import { BasketsTableName } from "./basket/basket-schemas";
import simulModule from "./simul/simul-module";
import { SimulTableName } from "./simul/simul-schemas";

export type VuuModuleName = "BASKET" | "SIMUL";

export interface VuuModule<T extends string = string> {
  createDataSource: (tableName: T) => DataSource;
}

const vuuModules: Record<
  VuuModuleName,
  VuuModule<BasketsTableName> | VuuModule<SimulTableName>
> = {
  BASKET: basketModule,
  SIMUL: simulModule,
};

export const vuuModule = <T extends string = string>(
  moduleName: VuuModuleName
) => vuuModules[moduleName] as VuuModule<T>;
