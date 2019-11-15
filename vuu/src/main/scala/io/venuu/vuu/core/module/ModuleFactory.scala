package io.venuu.vuu.core.module

import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.core.table.{Columns, DataTable}
import io.venuu.vuu.api.{JoinTableDef, TableDef}
import io.venuu.vuu.core.ViewServer
import io.venuu.vuu.net.rpc.RpcHandler
import io.venuu.vuu.provider.Provider

case class TableDefs protected(realizedTableDefs: List[TableDef], tableDefs: List[(TableDef, (DataTable, ViewServer) => Provider)], joinDefs: List[TableDefs => JoinTableDef]){

  def add(tableDef: TableDef, func: (DataTable, ViewServer) => Provider) : TableDefs = {
      TableDefs(realizedTableDefs, tableDefs ++ List((tableDef, func)), joinDefs)
  }

  def addRealized(tableDef: TableDef) : TableDefs = {
    TableDefs(realizedTableDefs ++ List(tableDef), tableDefs, joinDefs)
  }

  def addJoin(func: TableDefs => JoinTableDef) : TableDefs = {
    TableDefs(realizedTableDefs, tableDefs, joinDefs ++ List(func))
  }

  protected def getJoinDefFuncs() = joinDefs
  protected def getTableDefsAndProviders() = tableDefs
  protected def getRealizedTableDefs() = realizedTableDefs

  def get(name: String): TableDef = {
     realizedTableDefs.find( _.name == name).get
  }
}

case class  ModuleFactoryNode protected (tableDefs: TableDefs, rpc: List[ViewServer => RpcHandler], vsName: String){

  def addTable(tableDef: TableDef, func: (DataTable, ViewServer) => Provider): ModuleFactoryNode ={
    ModuleFactoryNode(tableDefs.add(tableDef, func), rpc, vsName)
  }

  def addJoinTable(func: TableDefs => JoinTableDef): ModuleFactoryNode ={
    ModuleFactoryNode(tableDefs.addJoin(func), rpc, vsName)
  }

  def addRpcHandler(rpcFunc: ViewServer => RpcHandler): ModuleFactoryNode ={
    ModuleFactoryNode(tableDefs, rpc ++ List(rpcFunc), vsName)
  }

  def asModule(): ViewServerModule = {

    val baseTables      = tableDefs.tableDefs
    val justBaseTables  = baseTables.map({case(tbl, provFunc) => tbl})

    var mutableTableDefs = TableDefs(justBaseTables, List(), List());

    //we do this loop to allow join tables to depend on other realized join tables
    tableDefs.joinDefs.foreach( toJTFunc => {

      val realizedJoinTableDef = toJTFunc(mutableTableDefs)
      
      mutableTableDefs = mutableTableDefs.addRealized(realizedJoinTableDef);
    })

    val theName = vsName

    new ViewServerModule {
      override def name: String =  theName
      override def tableDefs: List[TableDef] = mutableTableDefs.realizedTableDefs
      override def serializationMixin: AnyRef = null
      override def rpcHandlerUnrealized: ViewServer => RpcHandler = {
        rpc.head
      }

      override def getProviderForTable(table: DataTable, viewserver: ViewServer)(implicit time: Clock, lifecycleContainer: LifecycleContainer): Provider = {
        baseTables.find({case(td, func) => td.name == table.name }).get._2(table, viewserver)
      }
    }

  }
}

object ModuleFactory {

  implicit def stringToString(s: String) = new FieldDefString(s)

  def withNamespace(ns: String): ModuleFactoryNode ={
    return ModuleFactoryNode(TableDefs(List(), List(), List()), List(), ns);
  }

}
