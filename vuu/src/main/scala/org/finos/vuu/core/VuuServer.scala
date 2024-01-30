package org.finos.vuu.core

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
import org.finos.toolbox.thread.{LifeCycleRunOncePerThreadExecutorRunner, LifeCycleRunner, WorkItem}
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{JoinTableDef, TableDef, ViewPortDef}
import org.finos.vuu.core.module.{ModuleContainer, RealizedViewServerModule, StaticServedResource, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.feature.inmem.{VuuInMemPlugin, VuuInMemPluginType}
import org.finos.vuu.net._
import org.finos.vuu.net.http.{Http2Server, VuuHttp2Server}
import org.finos.vuu.net.json.{CoreJsonSerializationMixin, JsonVsSerializer, Serializer}
import org.finos.vuu.net.rest.RestService
import org.finos.vuu.net.rpc.{JsonSubTypeRegistry, RpcHandler}
import org.finos.vuu.net.ws.WebSocketServer
import org.finos.vuu.plugin.{Plugin, PluginRegistry}
import org.finos.vuu.provider.{JoinTableProvider, JoinTableProviderImpl, Provider, ProviderContainer}
import org.finos.vuu.viewport._

import java.util.concurrent.{Callable, FutureTask}

/**
 * Vuu Server
 */
class VuuServer(config: VuuServerConfig)(implicit lifecycle: LifecycleContainer, timeProvider: Clock, metricsProvider: MetricsProvider) extends LifecycleEnabled with StrictLogging with IVuuServer {

  final val serializer: Serializer[String, MessageBody] = JsonVsSerializer

  final val pluginRegistry: PluginRegistry = PluginRegistry()
  pluginRegistry.registerPlugin(new VuuInMemPlugin())

  JsonSubTypeRegistry.register(classOf[MessageBody], classOf[CoreJsonSerializationMixin])
  JsonSubTypeRegistry.register(classOf[ViewPortAction], classOf[ViewPortActionMixin])

  final val authenticator: Authenticator = config.security.authenticator
  final val tokenValidator: LoginTokenValidator = config.security.loginTokenValidator

  final val sessionContainer = new ClientSessionContainerImpl()

  final val joinProvider: JoinTableProvider = JoinTableProviderImpl()

  final val tableContainer = new TableContainer(joinProvider)

  final val providerContainer = new ProviderContainer(joinProvider)
  lifecycle(this).dependsOn(providerContainer)

  final val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer, pluginRegistry)

  final val moduleContainer = new ModuleContainer

  config.plugins.foreach(pluginRegistry.registerPlugin)
  config.modules.foreach(module => registerModule(module))

  final val serverApi = new CoreServerApiHandler(viewPortContainer, tableContainer, providerContainer)

  final val factory = new ViewServerHandlerFactoryImpl(authenticator, tokenValidator, sessionContainer, serverApi, JsonVsSerializer, moduleContainer)

  //order of creation here is important
  final val server = new WebSocketServer(config.wsOptions, factory)

  final private val restServices: List[RestService] = moduleContainer.getAll().flatMap(vsm => vsm.restServices)

  final val httpServer: Http2Server = VuuHttp2Server(config.httpOptions, restServices)

  private final val joinProviderRunner = new LifeCycleRunner("joinProviderRunner", () => joinProvider.runOnce())
  lifecycle(joinProviderRunner).dependsOn(joinProvider)

  private final  val handlerRunner = new LifeCycleRunner("sessionRunner", () => sessionContainer.runOnce(), minCycleTime = -1)
  lifecycle(handlerRunner).dependsOn(joinProviderRunner)

  private val viewPortRunner = if(config.threading.viewportThreads == 1){
    new LifeCycleRunner("viewPortRunner", () => viewPortContainer.runOnce())
  }else {
      new LifeCycleRunOncePerThreadExecutorRunner[ViewPort](s"viewPortExecutorRunner[${config.threading.viewportThreads}]", config.threading.viewportThreads, () => {
        viewPortContainer.getViewPorts.filter(vp => vp.isEnabled && !vp.hasGroupBy).map(vp => {
          pluginRegistry.withPlugin(vp.table.asTable.getTableDef.pluginType) {
            plugin => plugin.viewPortCallableFactory.createWorkItem(vp, viewPortContainer)
          }
        })
      })
    {
      override def newCallable(r: FutureTask[ViewPort]): Callable[ViewPort] = {
        pluginRegistry.withPlugin(r.get().table.asTable.getTableDef.pluginType) {
          plugin => plugin.viewPortCallableFactory.createCallable(r, viewPortContainer)
        }
      }
      override def newWorkItem(r: FutureTask[ViewPort]): WorkItem[ViewPort] = {
        pluginRegistry.withPlugin(r.get().table.asTable.getTableDef.pluginType) {
          plugin => plugin.viewPortCallableFactory.createWorkItem(r.get(), viewPortContainer)
        }
      }
    }
  }

  lifecycle(viewPortRunner).dependsOn(server)

  private val groupByRunner: LifeCycleRunner = if (config.threading.treeThreads == 1) {
    new LifeCycleRunner("groupByRunner", () => viewPortContainer.runGroupByOnce())
  } else {
    new LifeCycleRunOncePerThreadExecutorRunner[ViewPort](s"viewPortExecutorRunner-Tree[${config.threading.treeThreads}]", config.threading.treeThreads, () => {
      viewPortContainer.getViewPorts.filter(vp => vp.isEnabled && vp.hasGroupBy).map(vp => InMemViewPortTreeWorkItem(vp, viewPortContainer))
    }) {
      override def newCallable(r: FutureTask[ViewPort]): Callable[ViewPort] = InMemViewPortTreeCallable(r, viewPortContainer)

      override def newWorkItem(r: FutureTask[ViewPort]): WorkItem[ViewPort] = InMemViewPortTreeWorkItem(r.get(), viewPortContainer)
    }
  }

  lifecycle(groupByRunner).dependsOn(server)

  def createTable(tableDef: TableDef): DataTable = {
    logger.info(s"Creating table ${tableDef.name}")
    pluginRegistry.withPlugin(tableDef.pluginType){
      plugin =>
        val table = plugin.tableFactory.createTable(tableDef, joinProvider)
        tableContainer.addTable(table)
        table
    }
  }

  def createJoinTable(joinDef: JoinTableDef): DataTable = {
    logger.info(s"Creating joinTable ${joinDef.name}")
    pluginRegistry.withPlugin(joinDef.pluginType){
      plugin =>
        val table = plugin.joinTableFactory.createJoinTable(joinDef, tableContainer, joinProvider)
        tableContainer.addTable(table)
        table
    }
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
      override def tableDefContainer: TableDefContainer = module.tableDefContainer
      override def tableDefs: List[TableDef] = module.tableDefs
      override def serializationMixin: AnyRef = module.serializationMixin
      override def rpcHandlersUnrealized: List[IVuuServer => RpcHandler] = module.rpcHandlersUnrealized
      override def restServicesUnrealized: List[IVuuServer => RestService] = module.restServicesUnrealized
      override def getProviderForTable(table: DataTable, viewserver: IVuuServer)(implicit time: Clock, life: LifecycleContainer): Provider = {
        module.getProviderForTable(table, viewserver)(time, life)
      }
      override def staticFileResources(): List[StaticServedResource] = module.staticFileResources()
      override def viewPortDefs: Map[String, (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef] = module.viewPortDefs
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
