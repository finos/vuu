import { VuuDataRow, VuuRange, VuuRow } from "@vuu-ui/vuu-protocol-types";
import { makeVuuRows } from "./makeRows";

class MockDataService {
  static #instance: MockDataService;

  #rows: VuuRow<VuuDataRow>[] = [];

  private constructor() {
    console.log("create new Data service");
  }

  public static get instance(): MockDataService {
    if (!MockDataService.#instance) {
      MockDataService.#instance = new MockDataService();
    }
    return MockDataService.#instance;
  }

  getRows({ from, to }: VuuRange) {
    // We're opening ourselves up to clients that might mutate data
    // here, but this is used only in test - we know out clients
    // dont do that
    return this.#rows.slice(from, to);
  }

  load(rowCount = 1000) {
    const start = performance.now();
    this.#rows = makeVuuRows(0, rowCount);
    const end = performance.now();
    console.log(`[DataService] load ${rowCount} rows took ${end - start}ms`);
  }
}

export default MockDataService.instance;
