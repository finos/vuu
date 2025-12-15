package org.finos.vuu.test

import org.finos.vuu.api.ViewPortDef
import org.finos.vuu.core.AbstractVuuServer
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.net.{ClientSessionId, RequestContext}
import org.finos.vuu.plugin.Plugin
import org.finos.vuu.provider.{MockProvider, Provider, ProviderContainer}
import org.finos.vuu.viewport.{ViewPort, ViewPortRange}

trait TestVuuServer extends AbstractVuuServer {
  def registerProvider(dataTable: DataTable, provider: Provider): Unit

  def registerPlugin(plugin: Plugin): Unit

  def login(user: String): Unit

  def login(user: VuuUser): Unit

  def getProvider(module: String, table: String): MockProvider

  def createViewPort(module: String, tableName: String): ViewPort

  def createViewPort(module: String, tableName: String, viewPortRange: ViewPortRange): ViewPort

  def session: ClientSessionId

  def runOnce(): Unit

  def overrideViewPortDef(table: String, vpDefFunc: (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef): Unit

  def requestContext: RequestContext

  def tableContainer: TableContainer
}
