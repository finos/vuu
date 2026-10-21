package org.finos.vuu.person.rpc;

import org.finos.vuu.core.table.RowData;
import org.finos.vuu.core.table.TableContainer;
import org.finos.vuu.net.rpc.DefaultRpcHandlerImpl;
import org.finos.vuu.net.rpc.sessiontable.CreateSessionTableRpcHandler;
import org.finos.vuu.net.rpc.RpcPermissionChecker;
import org.finos.vuu.viewport.ViewPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class EditPersonRecordRpcHandler extends DefaultRpcHandlerImpl implements CreateSessionTableRpcHandler {

    private static final Logger logger = LoggerFactory.getLogger(EditPersonRecordRpcHandler.class);

    private final RpcPermissionChecker rpcPermissionChecker;
    private final TableContainer tableContainer;

    public EditPersonRecordRpcHandler(RpcPermissionChecker rpcPermissionChecker, TableContainer tableContainer) {
        super();
        registerCreateSessionTableRpcs();
        this.rpcPermissionChecker = rpcPermissionChecker;
        this.tableContainer = tableContainer;
    }

    @Override
    public RpcPermissionChecker rpcPermissionChecker() {
        return rpcPermissionChecker;
    }

    @Override
    public TableContainer tableContainer() {
        return tableContainer;
    }

    @Override
    public RowData customiseRowData(ViewPort vp, RowData rowData) {
        logger.info("Customise data for key {}", rowData.key());
        return rowData;
    }
}
