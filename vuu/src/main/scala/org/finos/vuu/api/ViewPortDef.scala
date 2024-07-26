package org.finos.vuu.api

import org.finos.vuu.core.table.Column
import org.finos.vuu.net.rpc.RpcHandler
import org.finos.vuu.viewport.{EmptyViewPortMenu, ViewPortMenu}

object ViewPortDef {
  def apply(columns: Array[Column], service: RpcHandler): ViewPortDef = {
    new ViewPortDef(columns, service)
  }

  def default(columns: Array[Column]): ViewPortDef = ViewPortDef(columns, NoRpcHandler)
}

class ViewPortDef(val columns: Array[Column], val service: RpcHandler) {}

object NoRpcHandler extends RpcHandler {
  override def menuItems(): ViewPortMenu = EmptyViewPortMenu
}
