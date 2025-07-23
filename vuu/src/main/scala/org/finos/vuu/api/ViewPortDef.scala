package org.finos.vuu.api

import org.finos.vuu.core.table.{Column, TableContainer}
import org.finos.vuu.net.rpc.{DefaultRpcHandler, RpcHandler}

object ViewPortDef {
  def apply(columns: Array[Column], service: RpcHandler): ViewPortDef = {
    new ViewPortDef(columns, service)
  }

  def default(columns: Array[Column], tableContainer: TableContainer): ViewPortDef = ViewPortDef(columns, new DefaultRpcHandler()(tableContainer))
}

class ViewPortDef(val columns: Array[Column], val service: RpcHandler) {}
