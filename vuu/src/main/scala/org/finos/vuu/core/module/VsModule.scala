package org.finos.vuu.core.module

import org.finos.vuu.api.{TableDef, ViewPortDef}
import org.finos.vuu.core.VuuServer
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.net.rest.RestService
import org.finos.vuu.net.rpc.RpcHandler
import org.finos.vuu.provider.{Provider, ProviderContainer}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock

import java.nio.file.Path

trait RealizedViewServerModule extends ViewServerModule {
  def rpcHandlers: List[RpcHandler]

  def rpcHandlerByService(service: String): Option[RpcHandler] = {
    rpcHandlers.foreach(h => println("Found:" + h.getClass.getSimpleName + "serviceIF:" + h.implementsService(service)))
    rpcHandlers.find(p => p.implementsService(service))
  }

  def restServices: List[RestService]
}

case class StaticServedResource(url: String, directory: Path, canBrowse: Boolean)

trait ViewServerModule {
  def name: String

  def tableDefs: List[TableDef]

  def serializationMixin: Object

  def rpcHandlersUnrealized: List[VuuServer => RpcHandler]

  def getProviderForTable(table: DataTable, viewserver: VuuServer)(implicit time: Clock, lifecycleContainer: LifecycleContainer): Provider

  def staticFileResources(): List[StaticServedResource]

  def restServicesUnrealized: List[VuuServer => RestService]

  def viewPortDefs: Map[String, (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef]
}
