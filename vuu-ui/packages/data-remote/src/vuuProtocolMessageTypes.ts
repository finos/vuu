export type ColumnDataType = 'int' | 'long' | 'double' | 'string' | 'char';

export type VuuMenuContext = 'cell' | 'row' | 'grid' | 'selected-rows';
export interface VuuMenuItem {
  context: VuuMenuContext;
  filter: string;
  name: string;
  rpcName: string;
}

export type VuuTable = {
  table: string;
  module: string;
};

export type VuuRange = {
  from: number;
  to: number;
};

export type VuuSortCol = {
  column: string;
  sortType: 'A' | 'D';
};

export type VuuSort = {
  sortDefs: VuuSortCol[];
};

export type VuuFilter = {
  filter: string;
};

export interface VuuMenu {
  name: string;
  menus: VuuMenuItem[];
}

export type VuuRow = {
  viewPortId: string;
  vpSize: number;
  rowIndex: number;
  rowKey: string;
  updateType: 'U' | 'D';
  ts: number;
  sel: 0 | 1;
  vpVersion: string;
  data: Array<string | number>;
};

export type AggTypeSum = 1;
export type AggTypeAverage = 2;
export type AggTypeCount = 3;
export type AggTypeHigh = 4;
export type AggTypeLow = 5;

export type AggType = AggTypeSum | AggTypeAverage | AggTypeCount | AggTypeHigh | AggTypeLow;

export type VuuAggregation = {
  column: string;
  aggType: AggType;
};

export type VuuLink = {
  parentVpId: string;
  link: {
    fromColumn: string;
    toTable: string;
    toColumn: string;
  };
};

export type VuuColumns = string[];
export type VuuGroupBy = string[];

export interface MessageInHeartBeat {
  type: 'HB';
  ts: number;
}

export interface MessageInLoginSuccess {
  type: 'LOGIN_SUCCESS';
  token: string;
}

export interface MessageInTableList {
  type: 'TABLE_LIST_RESP';
  tables: VuuTable[];
}

export interface MessageInTableMeta {
  columns: VuuColumns;
  dataTypes: ColumnDataType[];
  type: 'TABLE_META_RESP';
  table: VuuTable;
}

export interface MessageInMenus {
  type: 'VIEW_PORT_MENUS_RESP';
  menu: VuuMenu;
  vpId: string;
}

export interface MessageInMenu {
  type: 'VIEW_PORT_MENU_RESP';
  action: {
    table: VuuTable;
  };
}

export interface MessageInViewPortVisualLinks {
  type: 'VP_VISUAL_LINKS_RESP';
  links: VuuLink[];
  vpId: string;
}

export interface MessageInCreateViewPortSuccess {
  aggregations: VuuAggregation[];
  columns: VuuColumns;
  filterSpec: VuuFilter;
  groupBy: VuuGroupBy;
  range: VuuRange;
  sort: VuuSort;
  type: 'CREATE_VP_SUCCESS';
  table: string;
  viewPortId: string;
}

export interface MessageInChangeViewPortSuccess {
  type: 'CHANGE_VP_SUCCESS';
  viewPortId: string;
}
export interface MessageInChangeViewPortRangeSuccess {
  type: 'CHANGE_VP_RANGE_SUCCESS';
  viewPortId: string;
  from: number;
  to: number;
}
export interface MessageInDisableViewPortSuccess {
  type: 'DISABLE_VP_SUCCESS';
  viewPortId: string;
}
export interface MessageInEnableViewPortSuccess {
  type: 'ENABLE_VP_SUCCESS';
  viewPortId: string;
}
export interface MessageInRemoveViewPortSuccess {
  type: 'REMOVE_VP_SUCCESS';
  viewPortId: string;
}
export interface MessageInSelectSuccess {
  type: 'SET_SELECTION_SUCCESS';
  vpId: string;
}
export interface MessageInRPC {
  type: 'RPC_RESP';
  method: string;
  result: any;
}
export interface MessageInOpenTreeNodeSuccess {
  type: 'OPEN_TREE_SUCCESS';
}
export interface MessageInCloseTreeNodeSuccess {
  type: 'CLOSE_TREE_SUCCESS';
}
export interface MessageInError {
  msg: string;
  type: 'ERROR';
}
export interface MessageInCreateLinkSuccess {
  childVpId: string;
  childColumnName: string;
  parentVpId: string;
  parentColumnName: string;
  type: 'CREATE_VISUAL_LINK_SUCCESS';
}

export interface MessageInTableRows {
  batch: string;
  isLast: boolean;
  type: 'TABLE_ROW';
  timeStamp: number;
  rows: VuuRow[];
}

export type VuuProtocolMessageInBody =
  | MessageInHeartBeat
  | MessageInLoginSuccess
  | MessageInCreateViewPortSuccess
  | MessageInChangeViewPortSuccess
  | MessageInChangeViewPortRangeSuccess
  | MessageInDisableViewPortSuccess
  | MessageInEnableViewPortSuccess
  | MessageInRemoveViewPortSuccess
  | MessageInSelectSuccess
  | MessageInTableMeta
  | MessageInTableList
  | MessageInTableRows
  | MessageInMenus
  | MessageInMenu
  | MessageInRPC
  | MessageInViewPortVisualLinks
  | MessageInOpenTreeNodeSuccess
  | MessageInCloseTreeNodeSuccess
  | MessageInCreateLinkSuccess
  | MessageInError;

export interface VuuProtocolMessageIn {
  body: VuuProtocolMessageInBody;
  module: string;
  requestId: string;
  sessionId?: string;
  token: string;
  user: string;
}

export const isHeartbeat = (msg: object) => (msg as VuuProtocolMessageIn).body?.type === 'HB';

export interface VuuProtocolMessageOutBase {
  body: any;
  module: string;
  requestId: string;
  sessionId?: string;
  token: string;
  user: string;
}

export interface VuuProtocolMessageOutAuth extends VuuProtocolMessageOutBase {
  body: {
    type: 'AUTH';
    username: string;
    password: string;
  };
}

export interface VuuProtocolMessageOutLogin extends VuuProtocolMessageOutBase {
  body: {
    token: string;
    type: 'LOGIN';
    user: string;
  };
}

export interface VuuProtocolMessageOutHeartBeat extends VuuProtocolMessageOutBase {
  body: {
    type: 'HB_RESP';
    ts: number;
  };
}
export interface VuuProtocolMessageOutDisable extends VuuProtocolMessageOutBase {
  body: {
    type: 'DISABLE_VP';
    viewPortId: string;
  };
}

export interface VuuProtocolMessageOutEnable extends VuuProtocolMessageOutBase {
  body: {
    type: 'ENABLE_VP';
    viewPortId: string;
  };
}

export interface VuuProtocolMessageOutTableList extends VuuProtocolMessageOutBase {
  body: {
    type: 'GET_TABLE_LIST';
  };
}

export interface VuuProtocolMessageOutTableMeta extends VuuProtocolMessageOutBase {
  body: {
    type: 'GET_TABLE_META';
    table: VuuTable;
  };
}

export interface VuuProtocolMessageOutCreateViewPort extends VuuProtocolMessageOutBase {
  body: {
    columns: VuuColumns;
    filterSpec: VuuFilter;
    groupBy: string[];
    type: 'CREATE_VP';
    range: VuuRange;
    sort: VuuSort;
    table: VuuTable;
  };
}

export interface VuuProtocolMessageOutChangeViewPort extends VuuProtocolMessageOutBase {
  body: {
    aggregations: any[];
    columns: VuuColumns;
    filterSpec: VuuFilter;
    groupBy: string[];
    type: 'CHANGE_VP';
    range: VuuRange;
    sort: VuuSort;
    table: VuuTable;
  };
}

export interface VuuProtocolMessageOutRemoveViewPort extends VuuProtocolMessageOutBase {
  body: {
    type: 'REMOVE_VP';
    viewPortId: string;
  };
}

export interface VuuProtocolMessageOutSelection extends VuuProtocolMessageOutBase {
  body: {
    type: 'SET_SELECTION';
    selection: number[];
    vpId: string;
  };
}

export interface VuuProtocolMessageOutViewPortRange extends VuuProtocolMessageOutBase {
  body: {
    from: number;
    to: number;
    type: 'CHANGE_VP_RANGE';
    viewPortId: string;
  };
}

export interface VuuProtocolMessageOutVisualLinks extends VuuProtocolMessageOutBase {
  body: {
    type: 'GET_VP_VISUAL_LINKS';
    vpId: string;
  };
}
export interface VuuProtocolMessageOutMenus extends VuuProtocolMessageOutBase {
  body: {
    type: 'GET_VIEW_PORT_MENUS';
    vpId: string;
  };
}
export interface VuuProtocolMessageOutOpenTreeNode extends VuuProtocolMessageOutBase {
  body: {
    type: 'OPEN_TREE_NODE';
    vpId: string;
    treeKey: string;
  };
}
export interface VuuProtocolMessageOutCloseTreeNode extends VuuProtocolMessageOutBase {
  body: {
    type: 'CLOSE_TREE_NODE';
    vpId: string;
    treeKey: string;
  };
}
export interface VuuProtocolMessageOutCreateLink extends VuuProtocolMessageOutBase {
  body: {
    childVpId: string;
    parentColumnName: string;
    parentVpId: string;
    type: 'CREATE_VISUAL_LINK';
  };
}

export interface VuuProtocolMessageOutRpcCall extends VuuProtocolMessageOutBase {
  body: {
    type: 'RPC_CALL';
    method: string;
    service: string;
    params: any;
    namedParams?: any;
  };
}
export interface VuuProtocolMessageOutMenuSelectRPC extends VuuProtocolMessageOutBase {
  body: {
    type: 'VIEW_PORT_MENUS_SELECT_RPC';
    rpcName: string;
    vpId: string;
  };
}

export type VuuRpcMessagesOut = VuuProtocolMessageOutMenuSelectRPC;

export type VuuProtocolMessageOut =
  | VuuProtocolMessageOutAuth
  | VuuProtocolMessageOutLogin
  | VuuProtocolMessageOutHeartBeat
  | VuuProtocolMessageOutDisable
  | VuuProtocolMessageOutEnable
  | VuuProtocolMessageOutTableList
  | VuuProtocolMessageOutTableMeta
  | VuuProtocolMessageOutCreateViewPort
  | VuuProtocolMessageOutChangeViewPort
  | VuuProtocolMessageOutRemoveViewPort
  | VuuProtocolMessageOutSelection
  | VuuProtocolMessageOutViewPortRange
  | VuuProtocolMessageOutVisualLinks
  | VuuProtocolMessageOutMenus
  | VuuProtocolMessageOutOpenTreeNode
  | VuuProtocolMessageOutCloseTreeNode
  | VuuProtocolMessageOutCreateLink
  | VuuProtocolMessageOutMenuSelectRPC
  | VuuProtocolMessageOutRpcCall;
