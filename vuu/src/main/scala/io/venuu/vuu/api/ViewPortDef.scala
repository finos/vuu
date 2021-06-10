package io.venuu.vuu.api

import io.venuu.vuu.core.table.Column
import io.venuu.vuu.net.rpc.RpcHandler
import io.venuu.vuu.viewport.{EmptyViewPortMenu, ViewPortMenu}

object ViewPortDef {
  def apply(columns: Array[Column], service: RpcHandler): ViewPortDef = {
    new ViewPortDef(columns, service)
  }
  def default:ViewPortDef = NoViewPortDef
}

class ViewPortDef(val columns: Array[Column], val service: RpcHandler) {}

object NoRpcHandler extends RpcHandler{
  override def menuItems(): ViewPortMenu = EmptyViewPortMenu
}

object NoViewPortDef extends ViewPortDef(Array(), NoRpcHandler)
