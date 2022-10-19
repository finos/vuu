export const createColumnDefs = (setFilterDataProvider) => [
  {
    field: "bbg",
    sortable: true,
    width: 100,
    filter: "agTextColumnFilter",
  },
  {
    field: "currency",
    // hide: true,
    // rowGroup: true,
    sortable: true,
    width: 120,
    filter: "agSetColumnFilter",
    filterParams: {
      values: (params: SetFilterValuesFuncParams) => {
        setFilterDataProvider.getSetFilterData(params).then(params.success);
      },
    },
  },
  {
    field: "description",
    sortable: true,
    filter: "agTextColumnFilter",
  },
  {
    field: "exchange",
    sortable: true,
    filter: "agSetColumnFilter",
    filterParams: {
      values: (params: SetFilterValuesFuncParams) => {
        setFilterDataProvider.getSetFilterData(params).then(params.success);
      },
    },
  },
  { field: "isin", sortable: true, filter: true, width: 120 },
  {
    field: "lotSize",
    sortable: true,
    filter: "agNumberColumnFilter",
    width: 120,
  },
  { field: "ric", sortable: true, filter: true, width: 100 },
];
