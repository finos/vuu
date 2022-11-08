import { ColumnVO, LoadSuccessParams, SortModelItem } from "ag-grid-community";
import { AgGridFilter } from "./AgGridFilterUtils";

export interface AgGridRootDataRequest {
  filterModel?: AgGridFilter;
  from: number;
  to: number;
  groupKeys?: string[];
  parentIndex?: number;
  rowGroupCols?: ColumnVO[];
  sortModel?: SortModelItem[];
  success: (params: LoadSuccessParams) => void;
}

// const hasRangeOverlap = (
//   req1: AgGridRootDataRequest,
//   req2: AgGridRootDataRequest
// ) => req1.from < req2.to && req1.to > req2.from;

export class AgGridRequestQueue {
  private requests: AgGridRootDataRequest[] = [];
  push(request: AgGridRootDataRequest) {
    // console.log(
    //   `[RequestQueue] %cpush request ${request.from} - ${request.to}`,
    //   "color:purple; font-weight: bold;"
    // );
    this.purgeStaleRequests(request);
    this.requests.push(request);
  }

  shift() {
    this.requests.shift();
    // console.log(
    //   `[RequestQueue] %cshift (${this.requests.length} request(s) remaining)`,
    //   "color:purple; font-weight: bold;"
    // );
  }

  get(index: number) {
    return this.requests[index];
  }

  get length() {
    return this.requests.length;
  }

  toString() {
    return `${this.requests
      .map(
        (r) =>
          `${r.from} - ${r.to} (${
            r.groupKeys?.length > 0
              ? `[${r.groupKeys.join(",")}]`
              : "root request"
          })`
      )
      .join("\n")}`;
  }

  private purgeStaleRequests(request: AgGridRootDataRequest) {
    // can we just say, purgew any existing requests ...
    this.requests.length = 0;
    //   if (this.requests.some((req) => !hasRangeOverlap(req, request))) {
    //     this.requests = this.requests.filter((req) =>
    //       hasRangeOverlap(req, request)
    //     );
    //     console.log(
    //       `[RequestQueue] stale requests purged ${this.requests.length} remaining in queue`
    //     );
    //   } else {
    //     console.log(`[RequestQueue] no stale requests to purge`);
    //   }
  }
}
