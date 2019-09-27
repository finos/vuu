package io.venuu.vuu.core.module

import io.venuu.vuu.core.table.{Columns, DataTable}
import io.venuu.vuu.api.{JoinTableDef, TableDef}
import io.venuu.vuu.net.rpc.RpcHandler
import io.venuu.vuu.provider.Provider

case class TableDefs(){
  def get(name: String): TableDef ={
    return null
  }
}

case class ModuleFactoryNode(){
    def addTable(tableDef: TableDef, func: (DataTable) => Provider): ModuleFactoryNode ={
        this
    }

  def addJoinTable(func: TableDefs => JoinTableDef): ModuleFactoryNode ={
    this
  }

  def addRpcHandler(rpc: RpcHandler): ModuleFactoryNode ={
    this
  }

  def asModule(): ViewServerModule = {
    return null;
  }

}

object ModuleFactory {

  implicit def stringToString(s: String) = new FieldDefString(s)

  def withNamespace(ns: String): ModuleFactoryNode ={
    return null;
  }

}
