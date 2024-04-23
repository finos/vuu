import { DataSource, SuggestionFetcher } from "@finos/vuu-data-types";
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

// Note, this is useful but be aware that all modules will be bundled if this is imported.
// If only a single module is required, better to import it directly.
export const vuuModule = <T extends string = string>(
  moduleName: VuuModuleName
) => vuuModules[moduleName] as VuuModule<T>;
