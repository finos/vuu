package org.finos.vuu.viewport.sessiontable

import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api._
import org.finos.vuu.core.IVuuServer
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.module.{StaticServedResource, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.{Columns, DataTable, TableContainer}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rest.RestService
import org.finos.vuu.net.rpc.RpcHandler
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider, Provider, ProviderContainer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.viewport.ViewPortContainer
import org.finos.vuu.viewport.ViewPortTestFns.setupViewPort

trait AbstractSessionTestCase {

  def createViewServerModule(theName: String): ViewServerModule = {
    new ViewServerModule {
      override def tableDefContainer: TableDefContainer = ???
      override def name: String = theName
      override def tableDefs: List[TableDef] = ???
      override def serializationMixin: AnyRef = ???
      override def getProviderForTable(table: DataTable, viewserver: IVuuServer)(implicit time: Clock, lifecycleContainer: LifecycleContainer): Provider = ???
      override def staticFileResources(): List[StaticServedResource] = ???
      override def restServicesUnrealized: List[IVuuServer => RestService] = ???
      override def viewPortDefs: Map[String, (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef] = ???
    }
  }

  final val TEST_TIME = 1450770869442L
  var counter: Int = 0

  def setupEditableSessionTableInfra()(implicit clock: Clock, metrics: MetricsProvider): (ViewPortContainer, DataTable, MockProvider, ClientSessionId, OutboundRowPublishQueue, DataTable, TableContainer) = {
    implicit val lifecycle: LifecycleContainer = new LifecycleContainer

    val module = createViewServerModule("TEST")

    val processDef = TableDef(
      name = "process",
      keyField = "id",
      columns = Columns.fromNames("id".string(), "name".string(), "uptime".long(), "status".string()),
      VisualLinks(),
      joinFields = "id"
    )

    val fixSequenceDef = SessionTableDef(
      name = "fixSequenceReset",
      keyField = "process-id",
      columns = Columns.fromNames("process-id:String", "sequenceNumber:Long")
    )

    processDef.setModule(module)
    fixSequenceDef.setModule(module)

    val joinProvider = JoinTableProviderImpl()

    val tableContainer = new TableContainer(joinProvider)

    val process = tableContainer.createTable(processDef)
    val fixSequence = tableContainer.createTable(fixSequenceDef)

    val processProvider = new MockProvider(process)

    val providerContainer = new ProviderContainer(joinProvider)
    val viewPortContainer = setupViewPort(tableContainer, providerContainer)

    joinProvider.start()
    joinProvider.runOnce()

    val session = ClientSessionId("sess-01", "chris")

    val outQueue = new OutboundRowPublishQueue()

    (viewPortContainer, process, processProvider, session, outQueue, fixSequence, tableContainer)

  }

  def createViewPortDefFunc(tableContainer: TableContainer, rpcHandler: RpcHandler,  clock: Clock): (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef = {
    val func = (t: DataTable, provider: Provider, pc: ProviderContainer, table: TableContainer) => ViewPortDef(t.getTableDef.columns, rpcHandler)
    func
  }


}
