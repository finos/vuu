import { SuggestionFetcher } from "@vuu-ui/data-remote";
import { TypeaheadParams, VuuTable } from "@vuu-ui/data-types";
import { SetFilterValuesFuncParams } from "ag-grid-community";
import { MutableRefObject } from "react";

/**
 * This adapts a Vuu typeahead suggestion rpc call to the AgGrid filter API.
 */
export class FilterDataProvider {
  constructor(
    private table: VuuTable,
    private getSuggestions: MutableRefObject<SuggestionFetcher>
  ) {}
  getSetFilterData = async (params: SetFilterValuesFuncParams) => {
    const { colDef } = params;
    const vuuParams = [this.table, colDef.field] as TypeaheadParams;
    return this.getSuggestions.current(vuuParams);
  };
}
