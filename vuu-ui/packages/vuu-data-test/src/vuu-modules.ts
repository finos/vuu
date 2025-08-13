import { VuuModule } from "./core/module/VuuModule";
import { BasketsTableName } from "./basket/basket-schemas";
import { SimulTableName } from "./simul/simul-schemas";
import { TestTableName } from "./test/test-schemas";
import { simulModule } from "./simul/SimulModule";
import { basketModule } from "./basket/BasketModule";
import { testModule } from "./test/TestModule";

export type VuuModuleName = "BASKET" | "SIMUL" | "TEST";

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
/**
 * @deprecated get VuuDataSource from useData hook and create with new
 */
export const vuuModule = <T extends string = string>(
  moduleName: VuuModuleName,
) => vuuModules[moduleName] as VuuModule<T>;
