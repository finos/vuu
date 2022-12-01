import { Dao } from "./dao";

alasql.options.cache = false;

export class MockServer {
    constructor() {
        this.connections = {};
        this.nextConnectionId = 0;
        this.rowGroupCache = new Map();
    }

    init(allData) {
        this.dao = Dao(allData);
    }

    connect(listener) {
        var connectionId = this.nextConnectionId;
        this.nextConnectionId++;
        // keep a record of the connection
        const con = {
            id: connectionId,
            // the client callback that receives the events
            listener: listener,
            // we keep track of the rows in the client, so when the viewport changes,
            // we only send rows that are new, eg if viewport is length 10, and moves 2
            // positions, we only send the 2 new rows, as the client already has 8 of them
            rowsInClient: {},

            flatList: [],

            rowGroupCols: [],
            expandedGroups: {},

            // keep track of range, so when data items change, we know what to send
            firstRow: 0,
            lastRow: -1, // first row after last row, range doesn't exist
        };
        this.connections[connectionId] = con;

        this.createFlatList(con);
        this.sendResultsToClient(con);

        return connectionId;
    }

    setRowGroups(connectionId, rowGroupCols, valueCols) {
        var con = this.connections[connectionId];
        con.rowGroupCols = rowGroupCols;
        con.valueCols = valueCols;
        con.expandedGroups = {};
        this.createFlatList(con);
        this.sendResultsToClient(con);
    }

    setExpanded(connectionId, groupKey, expanded) {
        var con = this.connections[connectionId];
        con.expandedGroups[groupKey] = expanded;
        this.createFlatList(con);
        this.sendResultsToClient(con);
    }

    // pretend we are on a network, send message to client after 20ms
    sendEventAsync(connectionId, event) {
        var listener = this.connections[connectionId].listener;
        setTimeout(function () {
            listener(event);
        }, 20);
    }

    disconnect(connectionId) {
        delete this.connections[connectionId];
    }

    setViewportRange(connectionId, firstRow, lastRow) {
        var connection = this.connections[connectionId];
        connection.firstRow = firstRow;
        connection.lastRow = lastRow;
        this.sendResultsToClient(connection);
    }

    // removes any entries outside the viewport (firstRow to lastRow)
    purgeFromClientRows(con) {
        const { rowsInClient, firstRow, lastRow } = con;
        Object.keys(rowsInClient).forEach(function (rowIndexStr) {
            var rowIndex = parseInt(rowIndexStr);
            if (rowIndex < firstRow || rowIndex > lastRow) {
                delete rowsInClient[rowIndex];
            }
        });
    }

    // query database and create flat list
    createFlatList(con) {
        const groupCols = con.rowGroupCols; // ['country','sport']
        const valueCols = con.valueCols;
        const flatList = [];

        const recurse = (level, groupKeys) => {
            // const groupKeys = []; // ['ireland','swimming']

            const list = this.dao.getData({
                rowGroupCols: groupCols,
                groupKeys: groupKeys,
                sortModel: [],
                valueCols: valueCols,
            });

            const atGroupLevel = groupCols.length > level;
            if (atGroupLevel) {
                const field = groupCols[level].id;

                const expandedStates = con.expandedGroups;

                list.forEach((item) => {
                    const key = item[field];
                    const newGroupKeys = [...groupKeys, key].join('-');
                    const expanded = !!expandedStates[newGroupKeys];
                    item.expanded = expanded;
                    item.groupRow = true;
                    item.level = level;
                    item.groupField = field;
                    item.groupKey = key;
                    item.groupKeys = newGroupKeys;
                });
            }

            list.forEach((item) => {
                flatList.push(item);
                if (item.expanded) {
                    const newGroupKeys = [...groupKeys, item.groupKey];
                    recurse(level + 1, newGroupKeys);
                }
            });
        };

        recurse(0, []);

        con.flatList = flatList;
        con.rowsInClient = [];

        this.sendEventAsync(con.id, {
            eventType: 'rowCountChanged',
            rowCount: flatList.length,
        });
    }

    sendResultsToClient(con) {
        const { firstRow, lastRow } = con;
        if (firstRow < 0 || lastRow < firstRow) {
            console.warn('start or end is not valid');
            return;
        }

        // we want to keep track of what rows the client has
        var rowsInClient = con.rowsInClient;

        const rowDataMap = {};
        const flatList = con.flatList;

        // the map contains row indexes mapped to rows
        for (var i = firstRow; i <= lastRow; i++) {
            // if client already has this row, don't send it again
            if (rowsInClient[i]) {
                console.log('continue');
                continue;
            }
            // otherwise send the row. we send a copy of the row to mimic
            // going over network, so any further changes to the row in
            // the mock server is not reflected in the grid's copy

            rowDataMap[i] = JSON.parse(JSON.stringify(flatList[i]));
            // and record that the client has this row
            rowsInClient[i] = true;
        }

        this.sendEventAsync(con.id, {
            eventType: 'rowData',
            rowDataMap: rowDataMap,
        });

        this.purgeFromClientRows(con);
    }
}

