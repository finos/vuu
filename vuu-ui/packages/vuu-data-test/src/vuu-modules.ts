import { DataSource } from "@finos/vuu-data-types";
import { SuggestionFetcher } from "@finos/vuu-data-react";
import basketModule from "./basket/basket-module";
import { BasketsTableName } from "./basket/basket-schemas";
import simulModule from "./simul/simul-module";
import { SimulTableName } from "./simul/simul-schemas";
import testModule from "./test/test-module";
import { TestTableName } from "./test/test-schemas";

export type VuuModuleName = "BASKET" | "SIMUL" | "TEST";

export interface VuuModule<T extends string = string> {
  createDataSource: (tableName: T) => DataSource;
  typeaheadHook: () => SuggestionFetcher;
}

const vuuModules: Record<
  VuuModuleName,
  | VuuModule<BasketsTableName>
  | VuuModule<SimulTableName>
  | VuuModule<TestTableName>
> = {
  BASKET: basketModule,
  SIMUL: simulModule,
  TEST: testModule,
};

export const vuuModule = <T extends string = string>(
  moduleName: VuuModuleName
) => vuuModules[moduleName] as VuuModule<T>;
