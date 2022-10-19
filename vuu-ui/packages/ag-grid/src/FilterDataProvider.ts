import { SuggestionFetcher } from "@vuu-ui/data-remote";
import { TypeaheadParams } from "@vuu-ui/data-types";
import { SetFilterValuesFuncParams } from "ag-grid-community";
import { MutableRefObject } from "react";

export class FilterDataProvider {
  constructor(private getSuggestions: MutableRefObject<SuggestionFetcher>) {}
  getSetFilterData = async (params: SetFilterValuesFuncParams) => {
    const { colDef } = params;
    const vuuParams = [
      { module: "SIMUL", table: "instruments" },
      colDef.field,
    ] as TypeaheadParams;
    return this.getSuggestions.current(vuuParams);
  };
}
