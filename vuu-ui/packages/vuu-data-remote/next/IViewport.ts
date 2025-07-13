import {
  DataSourceRow,
  DataSourceSubscribeProps,
  WithFullConfig,
} from "@vuu-ui/vuu-data-types";
import {
  VuuDataRow,
  VuuRange,
  VuuRow,
  VuuTable,
  VuuViewportChangeRequest,
  VuuViewportCreateRequest,
  VuuViewportRangeRequest,
} from "@vuu-ui/vuu-protocol-types";

export interface IViewport {
  receiveRowsFromServer: (
    rows: VuuRow<VuuDataRow>[],
  ) => [number | undefined, DataSourceRow[] | undefined];
  serverViewportId: string;
  setClientRange: (
    range: VuuRange,
  ) => [DataSourceRow[] | undefined, VuuViewportRangeRequest | undefined];
  setConfig: (
    requestId: string,
    config: WithFullConfig,
  ) => VuuViewportChangeRequest;
  subscribe: (
    subscriptionProps: DataSourceSubscribeProps & { table?: VuuTable },
  ) => VuuViewportCreateRequest;
}
