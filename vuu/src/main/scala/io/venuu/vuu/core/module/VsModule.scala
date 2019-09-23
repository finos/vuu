/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 15/02/2016.

  */
package io.venuu.vuu.core.module

import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.TimeProvider
import io.venuu.vuu.api.TableDef
import io.venuu.vuu.core.table.DataTable
import io.venuu.vuu.net.rpc.RpcHandler
import io.venuu.vuu.provider.Provider

trait ViewServerModule {
  def name: String
  def tableDefs: List[TableDef]
  def serializationMixin: Object
  def rpcHandler:RpcHandler
  def getProviderForTable(table: DataTable)(implicit time: TimeProvider, lifecycleContainer: LifecycleContainer): Provider
}
