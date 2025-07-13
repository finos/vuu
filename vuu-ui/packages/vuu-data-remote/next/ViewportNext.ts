import type {
  VuuDataRow,
  VuuRange,
  VuuRow,
  VuuTable,
  VuuViewportChangeRequest,
  VuuViewportCreateRequest,
  VuuViewportRangeRequest,
} from "@vuu-ui/vuu-protocol-types";
import { rangeDiff } from "./range-utils";
import {
  DataSourceRow,
  DataSourceSubscribeProps,
  WithFullConfig,
} from "@vuu-ui/vuu-data-types";
import {
  type IKeySet,
  KeySet,
  NULL_RANGE,
  vanillaConfig,
  vuuRowToDataSourceRow,
} from "@vuu-ui/vuu-utils";
import { separateSizeFromDataRows } from "./vuu-message-utils";
import { ViewportProps } from "./test/IServerProxy";
import { IViewport } from "./IViewport";
import { rangeFromRows, ViewportCache } from "./ViewportCache";

type RangePosition =
  | "before"
  | "adjoin-before"
  | "overlap-before"
  | "match"
  | "overlap-after"
  | "adjoin-after"
  | "after"
  | "encloses-before"
  | "encloses"
  | "encloses-after"
  | "enclosed";
/**
 * Position of the second range, relative to first range
 *
 * @param Range first range
 * @param Range second range
 */
export const rangePosition = (
  { from: f1, to: t1 }: VuuRange,
  { from: f2, to: t2 }: VuuRange,
): RangePosition => {
  if (t2 < f1) {
    return "before";
  } else if (t2 === f1) {
    return "adjoin-before";
  } else if (t2 < t1) {
    if (f2 < f1) {
      return "overlap-before";
    } else {
      return "enclosed";
    }
  } else if (t2 === t1) {
    if (f1 === f2) {
      return "match";
    } else if (f2 < f1) {
      return "encloses-before";
    }
  } else if (t2 > t1) {
    if (f2 < f1) {
      return "encloses";
    } else if (f2 === f1) {
      return "encloses-after";
    } else if (f2 === t1) {
      return "adjoin-after";
    } else if (f2 < t1) {
      return "overlap-after";
    } else {
      return "after";
    }
  }
  throw Error("weve missed a condition");
};

export class PendingRangeRequests {
  #ranges: VuuRange[] = [];

  get length() {
    return this.#ranges.length;
  }

  get ranges() {
    return this.#ranges;
  }

  has(range: VuuRange) {
    for (let i = 0; i < this.length; i++) {
      const { from, to } = this.#ranges[i];
      if (from <= range.from && to >= range.to) {
        return true;
      } else if (from >= range.to) {
        return false;
      }
    }
    return false;
  }

  add(range: VuuRange) {
    if (this.length === 0) {
      this.#ranges.push({ ...range });
    } else {
      for (let i = 0; i < this.length; i++) {
        switch (rangePosition(this.#ranges[i], range)) {
          case "before":
            this.#ranges.splice(i, 0, { ...range });
            return;
          case "adjoin-before":
          case "overlap-before":
            // TODO check whether we're bridging two existing ranges
            this.ranges[i].from = range.from;
            return;
          case "match":
          case "overlap-after":
          case "adjoin-after":
            // TODO check whether we're bridging two existing ranges
            this.ranges[i].to = range.to;
            return;
          case "after":
            continue;
          case "encloses-before":
          case "encloses":
          case "encloses-after":
            // TODO check whether we're bridging two existing ranges
            this.ranges[i] = { ...range };
            return;
          case "enclosed":
            return;
        }
      }
      // if we get this far, it goes at the end
      this.#ranges.push(range);
    }
  }

  remove(range: VuuRange) {
    for (let i = 0; i < this.length; i++) {
      const { from, to } = this.#ranges[i];
      if (from === range.from && to === range.to) {
        this.#ranges.splice(i, 1);
        return;
      } else if (from === range.from && to > range.to) {
        // partial fill
        this.#ranges[i].from = range.to;
      }
    }
  }
}

export type ServerRequest = Omit<
  VuuViewportRangeRequest | VuuViewportChangeRequest,
  "viewPortId"
>;

export const isRangeRequest = (
  request?: ServerRequest,
): request is Omit<VuuViewportRangeRequest, "viewPortId"> =>
  request?.type === "CHANGE_VP_RANGE";

const defaultProps: Omit<ViewportProps, "Viewport"> = {};

export class ViewportNext implements IViewport {
  #cache: ViewportCache;
  #keys: IKeySet;
  #lastRangeSentToClient: VuuRange | undefined = undefined;
  #rangeRequests = new PendingRangeRequests();
  #subscriptionProps: DataSourceSubscribeProps | undefined;

  public serverViewportId = "";

  constructor({
    bufferSize = 0,
    keys = new KeySet(NULL_RANGE),
  }: ViewportProps = defaultProps) {
    // console.log(`[ExperimentalViewport] bufferSize=${bufferSize}`);
    this.#cache = new ViewportCache(bufferSize);
    this.#keys = keys;
  }

  get cache() {
    // TODO wrap this with test/debug check
    return this.#cache;
  }

  subscribe(
    subscriptionProps: DataSourceSubscribeProps & { table?: VuuTable },
  ): VuuViewportCreateRequest {
    this.#subscriptionProps = subscriptionProps;
    const {
      range = NULL_RANGE,
      table = { module: "ORDERS", table: "parentOrders" },
    } = subscriptionProps;

    if (range) {
      this.#cache.clientRange = range;
      this.#keys.reset(range);
    }
    return {
      ...vanillaConfig,
      type: "CREATE_VP",
      table,
      ...subscriptionProps,
      range: { from: range.from, to: range.to },
    };
  }

  setClientRange(
    range: VuuRange,
  ): [DataSourceRow[] | undefined, VuuViewportRangeRequest | undefined] {
    // TODO just return the rows
    const response: [
      DataSourceRow[] | undefined,
      VuuViewportRangeRequest | undefined,
    ] = [undefined, undefined];
    const lastRangeSentToClient = this.#lastRangeSentToClient;
    const rangeDelta = rangeDiff(lastRangeSentToClient, range);

    this.#keys.reset(range);
    this.#cache.clientRange = range;

    if (this.#cache.hasAllRows(range)) {
      const clientRows = this.#cache.getRows(rangeDelta);
      // console.log(
      //   `[Viewport] sending rows to client ${clientRows?.map((r) => r.rowIndex).join(",")}, range sent last time = (${lastRangeSentToClient.from}: ${lastRangeSentToClient.to}) rangeDelta (${rangeDelta.from}:${rangeDelta.to})`,
      // );
      response[0] = clientRows.map((row) =>
        vuuRowToDataSourceRow(row, this.#keys),
      );
      this.#lastRangeSentToClient = { ...range };
    } else if (!this.#rangeRequests.has(range)) {
      response[1] = this.createServerRangeRequest(this.#cache.range);
    }
    return response;
  }

  setConfig(requestId: string, config: WithFullConfig) {
    // console.log(
    //   `[ViewportNext] requestId ${requestId}setConfig ${JSON.stringify(config)}`,
    // );
    return {
      type: "CHANGE_VP",
      ...config,
      viewPortId: this.serverViewportId,
    } as VuuViewportChangeRequest;
  }

  receiveRowsFromServer(
    rows: VuuRow<VuuDataRow>[],
  ): [number | undefined, DataSourceRow[] | undefined] {
    let clientRows: VuuRow<VuuDataRow>[] | undefined = undefined;

    const [sizeRow, dataRows] = separateSizeFromDataRows(rows);

    if (sizeRow) {
      // console.log(`SIZE change ${sizeRow.vpSize}`);
      this.#cache.setRowCount(sizeRow.vpSize);
    }
    if (dataRows) {
      // TODO do we need to do this ?
      this.#rangeRequests.remove(rangeFromRows(rows));

      clientRows = this.#cache.addRows(rows, this.#lastRangeSentToClient);
      if (clientRows) {
        // console.log(
        //   `[Viewport] send rows to client ${clientRows?.map((r) => r.rowIndex).join(",")}, range sent last time = (${lastRangeSentToClient.from}: ${lastRangeSentToClient.to}) rangeDelta = ${rangeDelta.from}: ${rangeDelta.to}`,
        // );
        // console.table(clientRows);
        // } else {
        //   console.log(`[Viewport] no rows sent to client`);
        this.#lastRangeSentToClient = { ...this.#cache.clientRange };
      }
    }

    return [
      sizeRow?.vpSize,
      clientRows?.map((row) => vuuRowToDataSourceRow(row, this.#keys)),
    ];

    // const now = Date.now();
    // const lastRow = rows.at(-1);
    // if (lastRow) {
    //   console.log(`latency fetching data ${now - lastRow.ts}ms`);
    // }
  }

  private createServerRangeRequest(range: VuuRange): VuuViewportRangeRequest {
    this.#rangeRequests.add(range);
    // console.log(`create range request ${range.from}:${range.to}`);
    return {
      type: "CHANGE_VP_RANGE",
      viewPortId: this.serverViewportId,
      ...range,
    };
  }
}
