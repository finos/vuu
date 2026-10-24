import { expect, it } from "vitest";
import { filterPredicate, parseFilter } from "@vuu-ui/vuu-filter-parser";
import constituents from "../../vuu-data-test/src/basket/reference-data/constituents.json";
import { constituentFilter } from "../../../portal-examples/basket-trading/src/cell-renderers/col-header-add-symbol/constituentFilter";

it("parses exclusions for all basket definitions", () => {
  for (const basketId of [".FTSE100", ".HSI", ".NASDAQ100", ".SP500"]) {
    const rics = [
      ...new Set(
        constituents
          .filter((row) => row.basketId === basketId)
          .map((row) => row.ric),
      ),
    ].sort();
    const filter = constituentFilter(rics);
    const predicate = filterPredicate({ ric: 0 }, parseFilter(`(${filter})`));
    for (const ric of rics) {
      expect(predicate([ric])).toBe(false);
    }
    expect(predicate(["NOT-IN-BASKET"])).toBe(true);
    const searched = parseFilter(
      `(${filter}) and (description contains "Micro")`,
    );
    expect(searched).toBeDefined();
  }
});
