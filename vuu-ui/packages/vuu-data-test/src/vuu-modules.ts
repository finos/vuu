import { DataSource } from "@finos/vuu-data";
import basketModule from "./basket/basket-module";

export type VuuModuleName = "BASKET";

export interface VuuModule<T extends string = string> {
  createDataSource: (tableName: T) => DataSource;
}

const vuuModules: Record<VuuModuleName, VuuModule> = {
  BASKET: basketModule,
};

export const vuuModule = (moduleName: VuuModuleName) => vuuModules[moduleName];
