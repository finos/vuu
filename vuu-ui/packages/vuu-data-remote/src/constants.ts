let _connectionId = 0;

export const connectionId = {
  get nextValue() {
    return _connectionId++;
  },
};

export const msgType = {
  connect: "connect",
  connectionStatus: "connection-status",
  getFilterData: "GetFilterData",
  rowData: "rowData",
  rowSet: "rowset",
  select: "select",
  selectAll: "selectAll",
  selectNone: "selectNone",
  selected: "selected",
  snapshot: "snapshot",
  update: "update",
  createLink: "createLink",
  disable: "disable",
  enable: "enable",
  suspend: "suspend",
  resume: "resume",

  addSubscription: "AddSubscription",
  closeTreeNode: "closeTreeNode",
  columnList: "ColumnList",
  data: "data",
  openTreeNode: "openTreeNode",
  aggregate: "aggregate",
  filter: "filter",
  filterQuery: "filterQuery",
  filterData: "filterData",
  getSearchData: "GetSearchData",
  groupBy: "groupBy",
  modifySubscription: "ModifySubscription",
  searchData: "searchData",
  setGroupState: "setGroupState",
  size: "size",
  sort: "sort",
  subscribed: "Subscribed",
  tableList: "TableList",
  unsubscribe: "TerminateSubscription",
  viewRangeChanged: "ViewRangeChanged",
};
