import { VuuModule } from "./core/module/VuuModule";
import { basketModule } from "./basket/BasketModule";
import { BasketsTableName } from "./basket/basket-schemas";
import { SimulTableName } from "./simul/simul-schemas";
import { testModule } from "./test/TestModule";
import { TestTableName } from "./test/test-schemas";
import { simulModule } from "./simul/SimulModule";

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
export const vuuModule = <T extends string = string>(
  moduleName: VuuModuleName,
) => vuuModules[moduleName] as VuuModule<T>;
