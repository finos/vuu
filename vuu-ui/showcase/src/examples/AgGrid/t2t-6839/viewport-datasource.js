
export class ViewportDatasource {
    constructor(mockServer) {
        this.mockServer = mockServer;
        this.connectionId = this.mockServer.connect(
            this.eventListener.bind(this)
        );
    }

    // gets called by the grid, tells us what rows the grid is displaying, so time for
    // us to tell the server to give us the rows for that displayed range
    setViewportRange(firstRow, lastRow) {
        console.log('setViewportRange: ' + firstRow + ' to ' + lastRow);
        this.mockServer.setViewportRange(this.connectionId, firstRow, lastRow);
    }

    setRowGroups(rowGroupCols, valueCols) {
        this.mockServer.setRowGroups(this.connectionId, rowGroupCols, valueCols);
    }

    setExpanded(groupKey, expanded) {
        this.mockServer.setExpanded(this.connectionId, groupKey, expanded);
    }

    // gets called by the grid, provides us with the callbacks we need
    init(params) {
        this.params = params;
    }

    // gets called by grid, when grid is destroyed or this datasource is swapped out for another one
    destroy() {
        this.mockServer.disconnect(this.connectionId);
    }

    // manages events back from the server
    eventListener(event) {
        console.log(event.eventType, event);
        switch (event.eventType) {
            case 'rowCountChanged':
                this.onRowCountChanged(event);
                break;
            case 'rowData':
                this.onRowData(event);
                break;
        }
    }

    // process rowData event
    onRowData(event) {
        var rowDataFromServer = event.rowDataMap;
        // const mapped = rowDataFromServer.map(row => )
        this.params.setRowData(rowDataFromServer);
    }

    // process rowCount event
    onRowCountChanged(event) {
        var rowCountFromServer = event.rowCount;
        // this will get the grid to make set the height of the row container, so we can scroll vertically properly
        var keepRenderedRows = false; // prevents unnecessary row redraws
        this.params.setRowCount(rowCountFromServer, keepRenderedRows);
    }
};