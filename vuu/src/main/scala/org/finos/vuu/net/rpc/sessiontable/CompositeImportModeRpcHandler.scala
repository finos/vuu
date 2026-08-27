package org.finos.vuu.net.rpc.sessiontable

import org.finos.vuu.core.table.TableContainer
import org.finos.vuu.net.rpc.{DefaultRpcHandler, RpcPermissionChecker}

// This class is added for Java
abstract class CompositeImportModeRpcHandler(tableContainer: TableContainer, rpcPermissionChecker: RpcPermissionChecker)
  extends ImportSessionRpcHandler(tableContainer, rpcPermissionChecker)
    with EndSessionRpcHandler(tableContainer)
    with DefaultRpcHandler {}
