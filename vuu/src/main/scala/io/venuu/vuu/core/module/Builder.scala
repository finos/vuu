package io.venuu.vuu.core.module

import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.TimeProvider
import io.venuu.vuu.api.TableDef
import io.venuu.vuu.core.ViewServer
import io.venuu.vuu.core.table.DataTable
import io.venuu.vuu.net.rpc.RpcHandler
import io.venuu.vuu.provider.Provider

object ViewServerModuleBuilder {
  def noMapping(table: DataTable, viewServer: ViewServer): Provider = null
}

case class ViewServerModuleBuilder(name: String, tableDefs: List[TableDef] = List(), rpcHandler: RpcHandler = null, providerCallback: (DataTable, ViewServer) => Provider = ViewServerModuleBuilder.noMapping) extends ViewServerModule {

  def addTableDef(tableDef: TableDef): ViewServerModuleBuilder = {
    this.copy(tableDefs = tableDefs ++ List(tableDef))
  }

  def addTableDef(tableDef: TableDef*): ViewServerModuleBuilder = {
    this.copy(tableDefs = tableDefs ++ tableDef.toList)
  }

  def setRpcHandler(handler: RpcHandler): ViewServerModuleBuilder = {
    this.copy(rpcHandler = handler)
  }

  //def addSerializers(serializers)
  def setProvidersCallback(func: (DataTable, ViewServer) => Provider): ViewServerModuleBuilder = {
    this.copy(providerCallback = func)
    //this
  }

  override def serializationMixin: AnyRef = {null}

  override def getProviderForTable(table: DataTable, viewServer: ViewServer)(implicit time: TimeProvider, lifecycleContainer: LifecycleContainer): Provider = {
    providerCallback(table,viewServer)
  }
}
