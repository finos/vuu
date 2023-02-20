import { SuggestionFetcher } from "@finos/vuu-data";
import { TypeaheadParams, VuuTable } from "@finos/vuu-protocol-types";
import { MutableRefObject } from "react";

type SetFilterValuesFuncParams = {
  colDef: {
    field: string;
  };
};
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
