import { KeySet } from "./keyset";
import * as Message from "./messages";
import { ArrayBackedMovingWindow } from "./array-backed-moving-window";
import { getFullRange } from "@vuu-ui/utils/src/range-utils";
import { bufferBreakout } from "./buffer-range";
import {
  ServerToClientCreateViewPortSuccess,
  ClientToServerCreateLink,
  ClientToServerCreateViewPort,
  ClientToServerDisable,
  ClientToServerEnable,
  ClientToServerSelection,
  ClientToServerViewPortRange,
  VuuColumns,
  VuuMenu,
  VuuGroupBy,
  VuuLink,
  VuuRow,
  VuuTable,
  VuuAggregation,
  VuuSortCol,
  VuuRange,
  ClientToServerRemoveLink,
} from "@vuu-ui/data-types";
import {
  ServerProxySubscribeMessage,
  VuuUIMessageInDisabled,
  VuuUIMessageInEnabled,
  VuuUIMessageInFilter,
  VuuUIMessageInGroupBy,
  VuuUIMessageInSubscribed,
  VuuUIMessageInMenus,
  VuuUIMessageInSort,
  VuuUIMessageInViewPortVisualLinks,
  VuuUIMessageInVisualLinkCreated,
  VuuUIRow,
  VuuUIRowPredicate,
  VuuUIMessageInVisualLinkRemoved,
} from "../vuuUIMessageTypes";

const EMPTY_ARRAY: unknown[] = [];
const EMPTY_GROUPBY: VuuGroupBy = [];

interface Disable {
  type: "disable";
}
interface Enable {
  type: "enable";
}
interface ChangeViewportRange {
  type: "CHANGE_VP_RANGE";
}
interface Filter {
  data: { filter: any; filterQuery: string };
  type: "filter";
}
interface Aggregate {
  data: VuuAggregation[];
  type: "aggregate";
}
interface Selection {
  data: number[];
  type: "selection";
}
interface Sort {
  data: VuuSortCol[];
  type: "sort";
}
interface GroupBy {
  data: VuuGroupBy;
  type: "groupBy";
}
interface GroupByClear {
  data: VuuGroupBy;
  type: "groupByClear";
}
type CreateVisualLink = ClientToServerCreateLink;
type RemoveVisualLink = ClientToServerRemoveLink;

type AsyncOperation =
  | Aggregate
  | ChangeViewportRange
  | CreateVisualLink
  | RemoveVisualLink
  | Disable
  | Enable
  | Filter
  | GroupBy
  | GroupByClear
  | Selection
  | Sort;
type RangeRequestTuple = [ClientToServerViewPortRange | null, VuuUIRow[]?];
type RowSortPredicate = (row1: VuuUIRow, row2: VuuUIRow) => number;

const byRowIndex: RowSortPredicate = ([index1], [index2]) => index1 - index2;
export class Viewport {
  private aggregations: any;
  private bufferSize: number;
  private clientRange: VuuRange;
  private columns: any[];
  // TODO create this in constructor so we don't have to mark is as optional
  private dataWindow?: ArrayBackedMovingWindow = undefined;
  private filter: any;
  private filterSpec: any;
  private groupBy: any;
  private hasUpdates: boolean = false;
  private holdingPen: VuuUIRow[] = [];
  private keys: any;
  private lastTouchIdx: number | null = null;
  private links: VuuLink[] = [];
  private linkedParent: any = null;
  private pendingLinkedParent: any;
  private pendingOperations: any = new Map<string, AsyncOperation>();
  private pendingRangeRequest: any = null;
  private rowCountChanged: boolean = false;
  private sort: any;
  private tableSize: number = -1;

  public clientViewportId: string;
  public disabled: boolean = false;
  public isTree: boolean = false;
  public serverViewportId?: string;
  public status: "" | "subscribed" = "";
  public suspended: boolean = false;
  public table: VuuTable;

  constructor({
    viewport,
    table,
    aggregations,
    columns,
    range,
    bufferSize = 50,
    filter = "",
    filterQuery = "",
    sort = [],
    groupBy = [],
    visualLink,
  }: ServerProxySubscribeMessage) {
    this.clientViewportId = viewport;
    this.table = table;
    this.aggregations = aggregations;
    this.columns = columns;
    this.clientRange = range;
    this.bufferSize = bufferSize;
    this.sort = {
      sortDefs: sort,
    };
    this.groupBy = groupBy;
    this.filterSpec = {
      filter: filterQuery,
    };
    this.filter = filter;
    this.keys = new KeySet(range);
    this.pendingLinkedParent = visualLink;
  }

  get hasUpdatesToProcess() {
    if (this.suspended) {
      return false;
    }
    return this.rowCountChanged || this.hasUpdates;
  }

  subscribe() {
    return {
      type: Message.CREATE_VP,
      table: this.table,
      range: getFullRange(this.clientRange, this.bufferSize),
      aggregations: this.aggregations,
      columns: this.columns,
      sort: this.sort,
      groupBy: this.groupBy,
      filterSpec: this.filterSpec,
    } as ClientToServerCreateViewPort;
  }

  handleSubscribed({
    viewPortId,
    aggregations,
    columns,
    range,
    sort,
    groupBy,
    filterSpec,
  }: ServerToClientCreateViewPortSuccess) {
    this.serverViewportId = viewPortId;
    this.status = "subscribed";
    this.aggregations = aggregations;
    this.columns = columns;
    this.groupBy = groupBy;
    this.filterSpec = filterSpec;
    this.isTree = groupBy && groupBy.length > 0;
    this.dataWindow = new ArrayBackedMovingWindow(
      this.clientRange,
      range,
      this.bufferSize
    );

    console.log(
      `%cViewport subscribed
        clientVpId: ${this.clientViewportId}
        serverVpId: ${this.serverViewportId}
        table: ${this.table}
        aggregations: ${JSON.stringify(aggregations)}
        columns: ${columns.join(",")}
        range: ${JSON.stringify(range)}
        sort: ${JSON.stringify(sort)}
        groupBy: ${JSON.stringify(groupBy)}
        filterSpec: ${JSON.stringify(filterSpec)}
        bufferSize: ${this.bufferSize}
      `,
      "color: blue"
    );

    return {
      type: "subscribed",
      clientViewportId: this.clientViewportId,
      columns,
      filter: this.filter,
      filterSpec: this.filterSpec,
    } as VuuUIMessageInSubscribed;
  }

  awaitOperation(requestId: string, msg: AsyncOperation) {
    //TODO set uip a timeout mechanism here
    this.pendingOperations.set(requestId, msg);
  }

  // Return a message if we need to communicate this to client UI
  completeOperation(requestId: string, ...params: unknown[]) {
    const { clientViewportId, pendingOperations } = this;
    const { type, data } = pendingOperations.get(requestId);
    pendingOperations.delete(requestId);
    if (type === Message.CHANGE_VP_RANGE) {
      const [from, to] = params as [number, number];
      this.dataWindow?.setRange(from, to);
      //this.hasUpdates = true; // is this right ??????????
      this.pendingRangeRequest = null;
    } else if (type === "groupBy") {
      this.isTree = true;
      this.groupBy = data;
      return { clientViewportId, type, groupBy: data } as VuuUIMessageInGroupBy;
    } else if (type === "groupByClear") {
      this.isTree = false;
      this.groupBy = [];
      return {
        clientViewportId,
        type: "groupBy",
        groupBy: null,
      } as VuuUIMessageInGroupBy;
    } else if (type === "filter") {
      this.filterSpec = { filter: data.filterQuery };
      return { clientViewportId, type, ...data } as VuuUIMessageInFilter;
    } else if (type === "aggregate") {
      this.aggregations = data;
      return { clientViewportId, type, aggregations: data };
    } else if (type === "sort") {
      this.sort = { sortDefs: data };
      return { clientViewportId, type, sort: data } as VuuUIMessageInSort;
    } else if (type === "selection") {
      // should we do this here ?
      // this.selection = data;
    } else if (type === "disable") {
      this.disabled = true; // assuming its _SUCCESS, of course
      return {
        type: "disabled",
        clientViewportId,
      } as VuuUIMessageInDisabled;
    } else if (type === "enable") {
      this.disabled = false;
      return {
        type: "enabled",
        clientViewportId,
      } as VuuUIMessageInEnabled;
    } else if (type === Message.CREATE_VISUAL_LINK) {
      const [colName, parentViewportId, parentColName] = params;
      this.linkedParent = {
        colName,
        parentViewportId,
        parentColName,
      };
      this.pendingLinkedParent = null;
      return {
        type: "visual-link-created",
        clientViewportId,
        colName,
        parentViewportId,
        parentColName,
      } as VuuUIMessageInVisualLinkCreated;
    } else if (type === "REMOVE_VISUAL_LINK") {
      this.linkedParent = undefined;
      return {
        type: "visual-link-removed",
        clientViewportId,
      } as VuuUIMessageInVisualLinkRemoved;
    }
  }

  rangeRequest(requestId: string, range: VuuRange): RangeRequestTuple {
    // If we can satisfy the range request from the buffer, we will.
    // May or may not need to make a server request, depending on status of buffer
    const type = Message.CHANGE_VP_RANGE;
    // If dataWindow has all data for the new range, it will return the
    // delta of rows which are in the new range but were not in the
    // previous range.
    // Note: what if it doesn't have the entire range but DOES have all
    // rows that constitute the delta ? Is this even possible ?

    if (this.dataWindow) {
      const [serverDataRequired, clientRows, holdingRows] =
        this.dataWindow.setClientRange(range.from, range.to);
      const serverRequest =
        serverDataRequired &&
        bufferBreakout(
          this.pendingRangeRequest,
          range.from,
          range.to,
          this.bufferSize
        )
          ? ({
              type,
              viewPortId: this.serverViewportId,
              ...getFullRange(range, this.bufferSize, this.dataWindow.rowCount),
            } as ClientToServerViewPortRange)
          : null;
      if (serverRequest) {
        // TODO check that there os not already a pending server request for more data
        this.awaitOperation(requestId, { type });
        this.pendingRangeRequest = serverRequest;
      }

      // always reset the keys here, even if we're not going to return rows immediately.
      this.keys.reset(this.dataWindow.clientRange);

      const rowWithinRange: VuuUIRowPredicate = ([index]) =>
        index < range.from || index >= range.to;
      if (this.holdingPen.some(rowWithinRange)) {
        this.holdingPen = this.holdingPen.filter(
          ([index]) => index >= range.from && index < range.to
        );
      }

      const toClient = this.isTree
        ? toClientRowTree(this.groupBy, this.columns)
        : toClientRow;

      if (holdingRows.length) {
        holdingRows.forEach((row) => {
          this.holdingPen.push(toClient(row, this.keys));
        });
      }

      if (clientRows.length) {
        return [
          serverRequest,
          clientRows.map((row) => {
            return toClient(row, this.keys);
          }),
        ];
      } else {
        return [serverRequest];
      }
    } else {
      return [null];
    }
  }

  setLinks(links: VuuLink[]) {
    this.links = links;
    return [
      {
        type: "VP_VISUAL_LINKS_RESP",
        links,
        clientViewportId: this.clientViewportId,
      },
      this.pendingLinkedParent,
    ] as [VuuUIMessageInViewPortVisualLinks, any];
  }

  setMenu(menu: VuuMenu) {
    return {
      type: "VIEW_PORT_MENUS_RESP",
      menu,
      clientViewportId: this.clientViewportId,
    } as VuuUIMessageInMenus;
  }

  createLink(
    requestId: string,
    colName: string,
    parentVpId: string,
    parentColumnName: string
  ) {
    const message = {
      type: Message.CREATE_VISUAL_LINK,
      parentVpId,
      childVpId: this.serverViewportId,
      parentColumnName,
      childColumnName: colName,
    } as CreateVisualLink;
    this.awaitOperation(requestId, message);
    return message as ClientToServerCreateLink;
  }

  removeLink(requestId: string) {
    const message = {
      type: "REMOVE_VISUAL_LINK",
      childVpId: this.serverViewportId,
    } as RemoveVisualLink;
    this.awaitOperation(requestId, message);
    return message as ClientToServerRemoveLink;
  }

  suspend() {
    this.suspended = true;
  }

  resume() {
    this.suspended = false;
    return this.currentData();
  }

  currentData() {
    const out = [];
    if (this.dataWindow) {
      const records = this.dataWindow.getData();
      const { keys } = this;
      const toClient = this.isTree
        ? toClientRowTree(this.groupBy, this.columns)
        : toClientRow;
      for (let row of records) {
        if (row) {
          out.push(toClient(row, keys));
        }
      }
    }
    return out;
  }

  enable(requestId: string) {
    this.awaitOperation(requestId, { type: "enable" });
    return {
      type: Message.ENABLE_VP,
      viewPortId: this.serverViewportId,
    } as ClientToServerEnable;
  }

  disable(requestId: string) {
    this.awaitOperation(requestId, { type: "disable" });
    return {
      type: Message.DISABLE_VP,
      viewPortId: this.serverViewportId,
    } as ClientToServerDisable;
  }

  filterRequest(requestId: string, filter: any, filterQuery: string) {
    this.awaitOperation(requestId, {
      type: "filter",
      data: { filter, filterQuery },
    });
    return this.createRequest({ filterSpec: { filter: filterQuery } });
  }

  aggregateRequest(requestId: string, aggregations: VuuAggregation[]) {
    this.awaitOperation(requestId, { type: "aggregate", data: aggregations });
    return this.createRequest({ aggregations });
  }

  sortRequest(requestId: string, sortCols: VuuSortCol[]) {
    this.awaitOperation(requestId, { type: "sort", data: sortCols });
    return this.createRequest({ sort: { sortDefs: sortCols } });
  }

  groupByRequest(requestId: string, groupBy: VuuGroupBy = EMPTY_GROUPBY) {
    const type = groupBy === EMPTY_GROUPBY ? "groupByClear" : "groupBy";
    this.awaitOperation(requestId, { type, data: groupBy });
    return this.createRequest({ groupBy });
  }

  selectRequest(requestId: string, selection: number[]) {
    // TODO we need to do this in the client if we are to raise selection events
    // TODO is it right to set this here or should we wait for ACK from server ?
    this.awaitOperation(requestId, { type: "selection", data: selection });
    return {
      type: Message.SET_SELECTION,
      vpId: this.serverViewportId,
      selection,
    } as ClientToServerSelection;
  }

  handleUpdate(updateType: string, rowIndex: number, row: VuuRow) {
    if (this.dataWindow) {
      if (this.dataWindow.rowCount !== row.vpSize) {
        this.dataWindow.setRowCount(row.vpSize);
        this.rowCountChanged = true;
      }
      if (updateType === "U") {
        // Update will return true if row was within client range
        if (this.dataWindow.setAtIndex(rowIndex, row)) {
          this.hasUpdates = true;
        }
      }
    }
  }

  getNewRowCount = () => {
    if (this.rowCountChanged && this.dataWindow) {
      this.rowCountChanged = false;
      return this.dataWindow.rowCount;
    }
  };

  // This is called only after new data has been received from server - data
  // returned direcly from buffer does not use this.
  // If we have updates, but we don't yet have data for the full client range
  // in our buffer, store them in the holding pen. We know the remaining rows
  // have been requested and will arrive imminently. Soon as we receive data,
  // contents of holding pen plus additional rows received that fill the range
  // will be dispatched to client.
  // If we have any rows in the holding pen, and we now have a full set of
  // client data, make sure we empty the pen and send those rows to client,
  // along qith the new data.
  // TODO what if we're going backwards
  getClientRows(timeStamp: number) {
    if (this.hasUpdates && this.dataWindow) {
      const records = this.dataWindow.getData();
      const { keys } = this;
      const toClient = this.isTree
        ? toClientRowTree(this.groupBy, this.columns)
        : toClientRow;

      // NOte this should probably just check that we have all client rows within range ?
      const clientRows = this.dataWindow.hasAllRowsWithinRange
        ? this.holdingPen.splice(0)
        : undefined;

      const out = clientRows || this.holdingPen;

      for (let row of records) {
        if (row && row.ts >= timeStamp) {
          out.push(toClient(row, keys));
        }
      }
      this.hasUpdates = false;

      // this only matters where we scroll backwards and have holdingPen data
      // should we test for that explicitly ?
      return clientRows && clientRows.sort(byRowIndex);
    }
  }

  createRequest(params: any) {
    return {
      type: Message.CHANGE_VP,
      viewPortId: this.serverViewportId,
      aggregations: this.aggregations,
      columns: this.columns,
      sort: this.sort,
      groupBy: this.groupBy,
      filterSpec: this.filterSpec,
      ...params,
    };
  }
}

const toClientRow = (
  { rowIndex, rowKey, sel: isSelected, data }: VuuRow,
  keys: KeySet
) =>
  [
    rowIndex,
    keys.keyFor(rowIndex),
    true,
    null,
    null,
    1,
    rowKey,
    isSelected,
  ].concat(data) as VuuUIRow;

const toClientRowTree =
  (groupBy: VuuGroupBy, columns: VuuColumns) =>
  ({ rowIndex, rowKey, sel: isSelected, data }: VuuRow, keys: KeySet) => {
    let [depth, isExpanded /* path */, , isLeaf /* label */, , count, ...rest] =
      data;

    // TODO do we need this - the data is already there
    const steps = rowKey.split("|").slice(1);
    groupBy.forEach((col, i) => {
      const idx = columns.indexOf(col);
      rest[idx] = steps[i];
    });

    const record = [
      rowIndex,
      keys.keyFor(rowIndex),
      isLeaf,
      isExpanded,
      depth,
      count,
      rowKey,
      isSelected,
    ].concat(rest);

    return record as VuuUIRow;
  };
