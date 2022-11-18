package org.finos.vuu.core

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
import org.finos.toolbox.thread.{LifeCycleRunOncePerThreadExecutorRunner, LifeCycleRunner, WorkItem}
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{JoinTableDef, TableDef, ViewPortDef}
import org.finos.vuu.core.module.{ModuleContainer, RealizedViewServerModule, StaticServedResource, ViewServerModule}
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.net._
import org.finos.vuu.net.http.{Http2Server, VuuHttp2Server}
import org.finos.vuu.net.json.{CoreJsonSerializationMixin, JsonVsSerializer, Serializer}
import org.finos.vuu.net.rest.RestService
import org.finos.vuu.net.rpc.{JsonSubTypeRegistry, RpcHandler}
import org.finos.vuu.net.ws.WebSocketServer
import org.finos.vuu.provider.{JoinTableProvider, JoinTableProviderImpl, Provider, ProviderContainer}
import org.finos.vuu.viewport._

import java.util.concurrent.{Callable, FutureTask}

/**
 * Vuu Server
 */
class VuuServer(config: VuuServerConfig)(implicit lifecycle: LifecycleContainer, timeProvider: Clock, metricsProvider: MetricsProvider) extends LifecycleEnabled with StrictLogging {

  val serializer: Serializer[String, MessageBody] = JsonVsSerializer

  JsonSubTypeRegistry.register(classOf[MessageBody], classOf[CoreJsonSerializationMixin])
  JsonSubTypeRegistry.register(classOf[ViewPortAction], classOf[ViewPortActionMixin])

  val authenticator: Authenticator = config.security.authenticator
  val tokenValidator: LoginTokenValidator = config.security.loginTokenValidator

  val sessionContainer = new ClientSessionContainerImpl()

  val joinProvider: JoinTableProvider = JoinTableProviderImpl()

  val tableContainer = new TableContainer(joinProvider)

  val providerContainer = new ProviderContainer(joinProvider)
  lifecycle(this).dependsOn(providerContainer)

  val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer)

  val moduleContainer = new ModuleContainer

  config.modules.foreach(module => registerModule(module))

  val serverApi = new CoreServerApiHander(viewPortContainer, tableContainer, providerContainer)

  val factory = new ViewServerHandlerFactoryImpl(authenticator, tokenValidator, sessionContainer, serverApi, JsonVsSerializer, moduleContainer)

  //order of creation here is important
  val server = new WebSocketServer(config.wsOptions.wsPort, factory)

  val restServices: List[RestService] = moduleContainer.getAll().flatMap(vsm => vsm.restServices)

  val httpServer: Http2Server = VuuHttp2Server(config.httpOptions, restServices)

  val joinProviderRunner = new LifeCycleRunner("joinProviderRunner", () => joinProvider.runOnce())
  lifecycle(joinProviderRunner).dependsOn(joinProvider)

  val handlerRunner = new LifeCycleRunner("sessionRunner", () => sessionContainer.runOnce(), minCycleTime = 1)
  lifecycle(handlerRunner).dependsOn(joinProviderRunner)

  val viewPortRunner = if(config.threading.viewportThreads == 1){
    val viewPortRunner = new LifeCycleRunner("viewPortRunner", () => viewPortContainer.runOnce())
    lifecycle(viewPortRunner).dependsOn(server)
    viewPortRunner

  }else {
    val viewPortRunner =
      new LifeCycleRunOncePerThreadExecutorRunner[ViewPort](s"viewPortExecutorRunner[${config.threading.viewportThreads}]", config.threading.viewportThreads, () =>  {
      viewPortContainer.getViewPorts().filter(_.isEnabled).map(vp => ViewPortWorkItem(vp, viewPortContainer)) })
    {
      override def newCallable(r: FutureTask[ViewPort]): Callable[ViewPort] = ViewPortCallable(r, viewPortContainer)
      override def newWorkItem(r: FutureTask[ViewPort]): WorkItem[ViewPort] = ViewPortWorkItem(r.get(), viewPortContainer)
    }
    lifecycle(viewPortRunner).dependsOn(server)
    viewPortRunner
  }

  val groupByRunner = new LifeCycleRunner("groupByRunner", () => viewPortContainer.runGroupByOnce())
  lifecycle(groupByRunner).dependsOn(server)

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

    val vs = this

    val realized = new RealizedViewServerModule {
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

    module.tableDefs.foreach {

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
    }

    module.viewPortDefs.foreach({ case (table, vpFunc) =>
      viewPortContainer.addViewPortDefinition(table, vpFunc)
    })

    this
  }

  lifecycle(this).dependsOn(httpServer, server, joinProviderRunner, handlerRunner, viewPortRunner, joinProvider, groupByRunner)

  def join(): Unit = {
    lifecycle.join()
  }

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "vuuServer"
}
