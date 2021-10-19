package io.venuu.vuu.core

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.jmx.MetricsProvider
import io.venuu.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
import io.venuu.toolbox.thread.LifeCycleRunner
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.api.{JoinTableDef, TableDef, ViewPortDef}
import io.venuu.vuu.core.module.{ModuleContainer, RealizedViewServerModule, StaticServedResource, ViewServerModule}
import io.venuu.vuu.core.table.{DataTable, TableContainer}
import io.venuu.vuu.net._
import io.venuu.vuu.net.auth.AlwaysHappyAuthenticator
import io.venuu.vuu.net.http.{VuuHttp2Server, VuuHttp2ServerOptions}
import io.venuu.vuu.net.json.{CoreJsonSerializationMixin, JsonVsSerializer}
import io.venuu.vuu.net.rest.RestService
import io.venuu.vuu.net.rpc.{JsonSubTypeRegistry, RpcHandler}
import io.venuu.vuu.net.ws.WebSocketServer
import io.venuu.vuu.provider.{JoinTableProviderImpl, Provider, ProviderContainer}
import io.venuu.vuu.viewport.{ViewPortAction, ViewPortActionMixin, ViewPortContainer}

object VuuWebSocketOptions{
  def apply(): VuuWebSocketOptions = {
    VuuWebSocketOptionsImpl(8090, "/websocket")
  }
}

trait VuuWebSocketOptions{

  def wsPort: Int
  def uri: String

  def withWsPort(port: Int): VuuWebSocketOptions
  def withUri(uri: String): VuuWebSocketOptions

}

case class VuuWebSocketOptionsImpl(wsPort: Int, uri: String) extends VuuWebSocketOptions{
  override def withWsPort(port: Int): VuuWebSocketOptions = this.copy(wsPort = port)
  override def withUri(uri: String): VuuWebSocketOptions = this.copy(uri = uri)
}

case class VuuServerConfig(httpOptions: VuuHttp2ServerOptions, wsOptions: VuuWebSocketOptions, modules: List[ViewServerModule] = List()){
  def withModule(module: ViewServerModule): VuuServerConfig = {
    this.copy(modules = modules ++ List(module))
  }
}

/**
 * View Server
 */
class VuuServer(config: VuuServerConfig)(implicit lifecycle: LifecycleContainer, timeProvider: Clock, metricsProvider: MetricsProvider) extends LifecycleEnabled with StrictLogging{

  val serializer = JsonVsSerializer

  JsonSubTypeRegistry.register(classOf[MessageBody], classOf[CoreJsonSerializationMixin])
  JsonSubTypeRegistry.register(classOf[ViewPortAction], classOf[ViewPortActionMixin])

  val authenticator = new AlwaysHappyAuthenticator
  val tokenValidator = new AlwaysHappyLoginValidator

  val sessionContainer = new ClientSessionContainerImpl()

  val joinProvider = new JoinTableProviderImpl()

  val tableContainer = new TableContainer(joinProvider)

  val providerContainer = new ProviderContainer(joinProvider)

  val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer)

  val moduleContainer = new ModuleContainer

  config.modules.foreach( module => registerModule(module))

  val serverApi = new CoreServerApiHander(viewPortContainer, tableContainer, providerContainer)

  //val processor = new RequestProcessor(authenticator, tokenValidator, sessionContainer, serverApi, JsonVsSerializer)

  //val handler = new ViewServerHandler(serializer, processor)

  val factory = new ViewServerHandlerFactoryImpl(authenticator, tokenValidator, sessionContainer, serverApi, JsonVsSerializer, moduleContainer)

  //order of creation here is important
  val server = new WebSocketServer(config.wsOptions.wsPort, factory)

  val restServices = moduleContainer.getAll().flatMap(vsm => vsm.restServices)

  val httpServer = VuuHttp2Server(config.httpOptions, restServices)

  val joinProviderRunner = new LifeCycleRunner("joinProviderRunner", () => joinProvider.runOnce())
  lifecycle(joinProviderRunner).dependsOn(joinProvider)

  val handlerRunner = new LifeCycleRunner("sessionRunner", () => sessionContainer.runOnce(), minCycleTime = 1)
  lifecycle(handlerRunner).dependsOn(joinProviderRunner)

  val viewPortRunner = new LifeCycleRunner("viewPortRunner", () => viewPortContainer.runOnce())
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

  private def registerModule(module: ViewServerModule): VuuServer = {

    val vs = this;

    val realized = new RealizedViewServerModule{
      override def rpcHandlers: List[RpcHandler] = module.rpcHandlersUnrealized.map(_.apply(vs))
      override def restServices: List[RestService] = module.restServicesUnrealized.map(_.apply(vs))
      override def name: String = module.name
      override def tableDefs: List[TableDef] = module.tableDefs
      override def serializationMixin: AnyRef = module.serializationMixin
      override def rpcHandlersUnrealized: List[VuuServer => RpcHandler] = module.rpcHandlersUnrealized
      override def restServicesUnrealized: List[VuuServer => RestService] = module.restServicesUnrealized
      override def getProviderForTable(table: DataTable, viewserver: VuuServer)(implicit time: Clock, life: LifecycleContainer): Provider = {
        module.getProviderForTable(table, viewserver)(time, life)
      }
      override def staticFileResources(): List[StaticServedResource] = module.staticFileResources()
      override def viewPortDefs: Map[String, (DataTable, Provider, ProviderContainer) => ViewPortDef] = module.viewPortDefs
    }

    moduleContainer.register(realized)

    logger.info(s"[VIEW SERVER] registering module ${module.name} which contains ${module.tableDefs.size} tables")

    module.tableDefs.foreach( tableDef => tableDef match {

      case tableDef: JoinTableDef =>
        tableDef.setModule(module)
        createJoinTable(tableDef)

      case tableDef: TableDef if tableDef.autosubscribe =>
        tableDef.setModule(module)
        val table = createAutoSubscribeTable(tableDef)
        val provider = module.getProviderForTable(table, this)
        registerProvider(table, provider)

      case tableDef: TableDef if !tableDef.autosubscribe =>
        tableDef.setModule(module)
        val table = createTable(tableDef)
        logger.info(s"Loading provider for table ${table.name}...")
        val provider = module.getProviderForTable(table, this)
        registerProvider(table, provider)
    })

    module.viewPortDefs.foreach({case(table, vpFunc) => {
      viewPortContainer.addViewPortDefinition(table, vpFunc)
    }})

    this
  }

  lifecycle(this).dependsOn(httpServer, server,joinProviderRunner, handlerRunner, viewPortRunner, joinProvider)

  def join() = {
    lifecycle.join()
  }

  override def doStart(): Unit = {}
  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}
  override def doDestroy(): Unit = {}
  override val lifecycleId: String = "viewServer"
}
