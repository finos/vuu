package io.venuu.vuu.core

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.jmx.MetricsProvider
import io.venuu.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
import io.venuu.toolbox.thread.LifeCycleRunner
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.api.{JoinTableDef, TableDef}
import io.venuu.vuu.core.module.{ModuleContainer, RealizedViewServerModule, StaticServedResource, ViewServerModule}
import io.venuu.vuu.core.table.{DataTable, TableContainer}
import io.venuu.vuu.net._
import io.venuu.vuu.net.auth.AlwaysHappyAuthenticator
import io.venuu.vuu.net.http.Http2Server
import io.venuu.vuu.net.rpc.{JsonSubTypeRegistry, RpcHandler}
import io.venuu.vuu.net.ws.WebSocketServer
import io.venuu.vuu.provider.{JoinTableProviderImpl, Provider, ProviderContainer}
import io.venuu.vuu.viewport.ViewPortContainer

case class ViewServerConfig(httpPort: Int, httpsPort: Int, wsPort: Int, webRoot: String, modules: List[ViewServerModule] = List()){
  def withModule(module: ViewServerModule): ViewServerConfig = {
    this.copy(modules = modules ++ List(module))
  }
}

/**
 * View Server
 */
class ViewServer(config: ViewServerConfig)(implicit lifecycle: LifecycleContainer, timeProvider: Clock, metricsProvider: MetricsProvider) extends LifecycleEnabled with StrictLogging{

  val serializer = JsonVsSerializer

  JsonSubTypeRegistry.register(classOf[MessageBody], classOf[CoreJsonSerializationMixin])

  val authenticator = new AlwaysHappyAuthenticator
  val tokenValidator = new AlwaysHappyLoginValidator

  val sessionContainer = new ClientSessionContainerImpl()

  val joinProvider = new JoinTableProviderImpl()

  val tableContainer = new TableContainer(joinProvider)

  val viewPortContainer = new ViewPortContainer(tableContainer)

  val providerContainer = new ProviderContainer(joinProvider)

  val moduleContainer = new ModuleContainer

  config.modules.foreach( module => registerModule(module))

  val serverApi = new CoreServerApiHander(viewPortContainer, tableContainer, providerContainer)

  //val processor = new RequestProcessor(authenticator, tokenValidator, sessionContainer, serverApi, JsonVsSerializer)

  //val handler = new ViewServerHandler(serializer, processor)

  val factory = new ViewServerHandlerFactoryImpl(authenticator, tokenValidator, sessionContainer, serverApi, JsonVsSerializer, moduleContainer)

  //order of creation here is important
  val server = new WebSocketServer(config.wsPort, factory)

  val httpServer = new Http2Server(config.httpPort, config.httpsPort, config.webRoot)

  val joinProviderRunner = new LifeCycleRunner("joinProviderRunner", () => joinProvider.runOnce() )
  lifecycle(joinProviderRunner).dependsOn(joinProvider)

  val handlerRunner = new LifeCycleRunner("sessionRunner", () => sessionContainer.runOnce() )
  lifecycle(handlerRunner).dependsOn(joinProviderRunner)

  val viewPortRunner = new LifeCycleRunner("viewPortRunner", () => viewPortContainer.runOnce() )
  lifecycle(viewPortRunner).dependsOn(server)

  val groupByRunner = new LifeCycleRunner("groupByRunner", () => viewPortContainer.runGroupByOnce() )
  lifecycle(viewPortRunner).dependsOn(server)

  def createTable(tableDef: TableDef): DataTable = {
    logger.info(s"Creating table ${tableDef.name}")
    tableContainer.createTable(tableDef)
  }

  def createJoinTable(joinDef: JoinTableDef): DataTable = {
    logger.info(s"Creating joinTable ${joinDef.name}")
    tableContainer.createJoinTable(joinDef)
  }

  def createAutoSubscribeTable(tableDef: TableDef): DataTable = {
    logger.info(s"Creating autoSubTable ${tableDef.name}")
    tableContainer.createAutoSubscribeTable(tableDef)
  }

  def registerProvider(table: DataTable, provider: Provider): Unit = {
    providerContainer.add(table, provider)
    table.setProvider(provider)
  }

  private def registerModule(module: ViewServerModule): ViewServer = {

    val vs = this;

    val realized = new RealizedViewServerModule{
      override def rpcHandler: RpcHandler = module.rpcHandlerUnrealized.apply(vs)
      override def name: String = module.name
      override def tableDefs: List[TableDef] = module.tableDefs
      override def serializationMixin: AnyRef = module.serializationMixin
      override def rpcHandlerUnrealized: ViewServer => RpcHandler = module.rpcHandlerUnrealized
      override def getProviderForTable(table: DataTable, viewserver: ViewServer)(implicit time: Clock, life: LifecycleContainer): Provider = {
        module.getProviderForTable(table, viewserver)(time, life)
      }
      override def staticFileResources(): List[StaticServedResource] = module.staticFileResources()
    }

    moduleContainer.register(realized)

    logger.info(s"[VIEW SERVER] registering module ${module.name} which contains ${module.tableDefs.size} tables")

    module.tableDefs.foreach( tableDef => tableDef match {

      case tableDef: JoinTableDef =>
        createJoinTable(tableDef)

      case tableDef: TableDef if tableDef.autosubscribe =>
        val table = createAutoSubscribeTable(tableDef)
        val provider = module.getProviderForTable(table, this)
        registerProvider(table, provider)

      case tableDef: TableDef if !tableDef.autosubscribe =>
        val table = createTable(tableDef)
        logger.info(s"Loading provider for table ${table.name}...")
        val provider = module.getProviderForTable(table, this)
        registerProvider(table, provider)

    })

    this
  }

  lifecycle(this).dependsOn(httpServer, server,joinProviderRunner, handlerRunner, viewPortRunner, joinProvider)

  def join() = httpServer.join()

  override def doStart(): Unit = {}
  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}
  override def doDestroy(): Unit = {}
  override val lifecycleId: String = "viewServer"
}
