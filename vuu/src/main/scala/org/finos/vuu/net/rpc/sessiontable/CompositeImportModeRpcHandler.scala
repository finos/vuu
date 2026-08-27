package org.finos.vuu.net.rpc.sessiontable

import org.finos.vuu.core.table.TableContainer
import org.finos.vuu.net.rpc.DefaultRpcHandler

// This class is added for Java
abstract class CompositeImportModeRpcHandler(tableContainer: TableContainer)
  extends ImportSessionRpcHandler(tableContainer)
    with EndSessionRpcHandler(tableContainer)
    with DefaultRpcHandler {}
