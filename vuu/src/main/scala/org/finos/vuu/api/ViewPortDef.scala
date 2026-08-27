package org.finos.vuu.api

import org.finos.vuu.core.table.{Column, DataTable, TableContainer}
import org.finos.vuu.net.rpc.{DefaultRpcHandler, RpcHandler}
import org.finos.vuu.provider.{Provider, ProviderContainer}

object ViewPortDef {
  def apply(columns: Array[Column], service: RpcHandler): ViewPortDef = {
    new ViewPortDef(columns, service)
  }

  def createDefault(columns: Array[Column]): ViewPortDef = ViewPortDef(columns, DefaultRpcHandler.apply())
}

class ViewPortDef(val columns: Array[Column], val service: RpcHandler) {}

object ViewPortDefHelper {

  def defaultDefaultViewPortDefFunc: (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef = {
    (t, _, _, _) =>
      ViewPortDef.createDefault(t.getTableDef.getColumns)
  }

  def viewPortDefFunc(service: RpcHandler): (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef = {
    (t, _, _, _) =>
      ViewPortDef.apply(t.getTableDef.getColumns, service)
  }
}