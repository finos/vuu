import "./styles.css";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-alpine.css";
import { Grid } from "ag-grid-community";
import CustomGroupRenderer from "./customGroupCellRenderer";
import { MockServer } from "./mock-server";
import { ViewportDatasource } from "./viewport-datasource";
import "ag-grid-enterprise";

var viewportDatasource;

const columnDefs = [
  { field: 'athlete', minWidth: 150 },
  { field: 'country', enableRowGroup: true, minWidth: 150 },
  { field: 'sport', enableRowGroup: true, minWidth: 120 },
  { field: 'gold', aggFunc: 'sum' },
  { field: 'silver', aggFunc: 'sum' },
  { field: 'bronze', aggFunc: 'sum' },
];

const onRowGroupOpened = (params) => {
  const groupKeys = params.data.groupKeys;
  viewportDatasource.setExpanded(groupKeys, params.expanded);
};

const onColumnRowGroupChanged = (params) => {
  const { columns } = params;
  const colIds = columns.map((c) => ({ id: c.getId() }));
  const valueCols = params.columnApi
    .getValueColumns()
    .map((c) => ({ aggFunc: c.aggFunc, id: c.getId() }));

  viewportDatasource.setRowGroups(colIds, valueCols);
};

const autoGroupColumnDef = {
  headerName: 'Group',
  cellRenderer: CustomGroupRenderer,
  minWidth: 250,
};

const defaultColDef = {
  flex: 1,
  minWidth: 140,
  resizable: true,
}

const gridOptions = {
  columnDefs: columnDefs,
  defaultColDef: defaultColDef,
  rowGroupPanelShow: 'always',
  autoGroupColumnDef: autoGroupColumnDef,
  rowModelType: 'viewport',
  onColumnRowGroupChanged: onColumnRowGroupChanged,
  onRowGroupOpened: onRowGroupOpened,
};

// setup the grid after the page has finished loading
var gridDiv = document.getElementById('myGrid');
new Grid(gridDiv, gridOptions);

fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
  .then((response) => response.json())
  .then(function (data) {
    // set up a mock server - real code will not do this, it will contact your
    // real server to get what it needs
    var mockServer = new MockServer();
    mockServer.init(data);

    viewportDatasource = new ViewportDatasource(mockServer);
    gridOptions.api.setViewportDatasource(viewportDatasource);
  });