/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 15/02/2016.

  */
package io.venuu.vuu.core.module

import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.api.TableDef
import io.venuu.vuu.core.VuuServer
import io.venuu.vuu.core.table.DataTable
import io.venuu.vuu.net.rest.RestService
import io.venuu.vuu.net.rpc.RpcHandler
import io.venuu.vuu.provider.Provider

import java.nio.file.Path

trait RealizedViewServerModule extends ViewServerModule{
  def rpcHandler: RpcHandler
  def restServices: List[RestService]
}

case class StaticServedResource(url: String, directory: Path, canBrowse: Boolean)

trait ViewServerModule {
  def name: String
  def tableDefs: List[TableDef]
  def serializationMixin: Object
  def rpcHandlerUnrealized: VuuServer => RpcHandler
  def getProviderForTable(table: DataTable, viewserver: VuuServer)(implicit time: Clock, lifecycleContainer: LifecycleContainer): Provider
  def staticFileResources():  List[StaticServedResource]
  def restServicesUnrealized: List[VuuServer => RestService]
}
