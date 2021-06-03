package io.venuu.vuu.api

import io.venuu.vuu.core.table.Column
import io.venuu.vuu.net.rpc.RpcHandler

object ViewPortDef {
  def apply(columns: Array[Column], service: RpcHandler): ViewPortDef = {
    new ViewPortDef(columns, service)
  }
  def default:ViewPortDef = NoViewPortDef
}

class ViewPortDef(val columns: Array[Column], val service: RpcHandler) {}

object NoViewPortDef extends ViewPortDef(Array(), null)
