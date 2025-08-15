package org.finos.vuu.test.impl

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{JoinTableDef, SessionTableDef, TableDef, ViewPortDef}
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.module._
import org.finos.vuu.core.table.{DataTable, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.core.{CoreServerApiHandler, IVuuServer}
import org.finos.vuu.feature.inmem.{VuuInMemPlugin, VuuInMemPluginType}
import org.finos.vuu.net.auth.AlwaysHappyAuthenticator
import org.finos.vuu.net.json.{CoreJsonSerializationMixin, JsonVsSerializer, Serializer}
import org.finos.vuu.net.rest.RestService
import org.finos.vuu.net.rpc.{JsonSubTypeRegistry, RpcHandler}
import org.finos.vuu.net._
import org.finos.vuu.net.flowcontrol.FlowControllerFactory
import org.finos.vuu.plugin.{DefaultPluginRegistry, Plugin}
import org.finos.vuu.provider._
import org.finos.vuu.test.rpc.RpcDynamicProxy
import org.finos.vuu.test.{TestViewPort, TestVuuServer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.viewport.{DefaultRange, ViewPort, ViewPortAction, ViewPortActionMixin, ViewPortContainer, ViewPortRange}

import scala.reflect.classTag

class TestVuuServerImpl(val modules: List[ViewServerModule])(implicit clock: Clock, lifecycle: LifecycleContainer, metrics: MetricsProvider) extends TestVuuServer with LifecycleEnabled with StrictLogging {

  private val serializer: Serializer[String, MessageBody] = JsonVsSerializer

  JsonSubTypeRegistry.register(classOf[MessageBody], classOf[CoreJsonSerializationMixin])
  JsonSubTypeRegistry.register(classOf[ViewPortAction], classOf[ViewPortActionMixin])

  val sessionContainer = new ClientSessionContainerImpl()

  val authenticator = new AlwaysHappyAuthenticator
  val tokenValidator = new AlwaysHappyLoginValidator
  val flowControllerFactory = FlowControllerFactory(hasHeartbeat = false)

  val joinProvider: JoinTableProvider = JoinTableProviderImpl()

  val tableContainer = new TableContainer(joinProvider)

  val providerContainer = new ProviderContainer(joinProvider)

  lifecycle(this).dependsOn(providerContainer)

  val pluginRegistry = new DefaultPluginRegistry
  pluginRegistry.registerPlugin(new VuuInMemPlugin)


  val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer, pluginRegistry)

  val moduleContainer = new ModuleContainer

  modules.foreach(module => registerModule(module))

  val serverApi = new CoreServerApiHandler(viewPortContainer, tableContainer, providerContainer)

  val factory = new ViewServerHandlerFactoryImpl(authenticator, tokenValidator, sessionContainer, serverApi, JsonVsSerializer, moduleContainer, flowControllerFactory)

  val queue = new OutboundRowPublishQueue()

  def createJoinTable(joinDef: JoinTableDef): DataTable = {
    logger.debug(s"Creating joinTable ${joinDef.name}")
    tableContainer.createJoinTable(joinDef)
  }

  def createAutoSubscribeTable(tableDef: TableDef): DataTable = {
    logger.debug(s"Creating autoSubTable ${tableDef.name}")
    tableContainer.createAutoSubscribeTable(tableDef)
  }

  def createTable(tableDef: TableDef): DataTable = {
    logger.debug(s"Creating table ${tableDef.name}")
    tableContainer.createTable(tableDef)
  }

  def registerProvider(table: DataTable, provider: Provider): Unit = {
    providerContainer.add(table, provider)
    table.setProvider(provider)
  }

  private def registerModule(module: ViewServerModule): IVuuServer = {

    val vs = this

    val realized = new RealizedViewServerModule {
      override def restServices: List[RestService] = module.restServicesUnrealized.map(_.apply(vs))
      override def name: String = module.name
      override def tableDefContainer: TableDefContainer = module.tableDefContainer
      override def tableDefs: List[TableDef] = module.tableDefs
      override def serializationMixin: AnyRef = module.serializationMixin
      override def restServicesUnrealized: List[IVuuServer => RestService] = module.restServicesUnrealized
      override def getProviderForTable(table: DataTable, viewserver: IVuuServer)(implicit time: Clock, life: LifecycleContainer): Provider = {
        module.getProviderForTable(table, viewserver)(time, life)
      }

      override def staticFileResources(): List[StaticServedResource] = module.staticFileResources()
      override def viewPortDefs: Map[String, (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef] = module.viewPortDefs
    }

    moduleContainer.register(realized)

    logger.debug(s"[VIEW SERVER] registering module ${module.name} which contains ${module.tableDefs.size} tables")

    module.tableDefs.foreach {

      case tableDef: JoinTableDef =>
        tableDef.setModule(module)
        createJoinTable(tableDef)

      case tableDef: SessionTableDef =>
        tableDef.setModule(module)
        val table = createTable(tableDef)
        val provider = module.getProviderForTable(table, this)
        registerProvider(table, provider)

      case tableDef: TableDef if tableDef.autosubscribe =>
        tableDef.setModule(module)
        val table = createAutoSubscribeTable(tableDef)
        val provider = new MockProvider(table)
        registerProvider(table, provider)

      case tableDef: TableDef if !tableDef.autosubscribe =>
        tableDef.setModule(module)
        val table = createTable(tableDef)
        logger.debug(s"Loading provider for table ${table.name}...")
        val provider = new MockProvider(table)
        registerProvider(table, provider)
    }

    module.viewPortDefs.foreach({ case (table, vpFunc) =>
      viewPortContainer.addViewPortDefinition(table, vpFunc)
    })

    this
  }

  override def getProvider(module: String, table: String): MockProvider = {
    providerContainer.getProviderForTable(table) match {
      case Some(provider: Provider) => provider.asInstanceOf[MockProvider]
      case None =>
        throw new Exception("No provider found in test table")
    }
  }

  override def createViewPort(module: String, tableName: String, viewPortRange: ViewPortRange): TestViewPort = {
    val table = tableContainer.getTable(tableName)
    val columns = ViewPortColumnCreator.create(table, table.getTableDef.columns.map(_.name).toList)
    val viewport = viewPortContainer.create(RequestId.oneNew(), session, queue, table, viewPortRange, columns)
    new TestViewPort(viewport)
  }

  override def createViewPort(module: String, tableName: String): TestViewPort = createViewPort(module, tableName, DefaultRange)

  override def session: ClientSessionId = {
    clientSessionId
  }

  override def runOnce(): Unit = {
    viewPortContainer.runOnce()
  }

  override def doStart(): Unit = {lifecycle.start()}

  override def doStop(): Unit = {lifecycle.stop()}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "TestVuuServerImpl#" + getClass.hashCode()

  var handler: ViewServerHandler = null
  val channel = new TestChannel
  var clientSessionId: ClientSessionId = null

  override def login(user: String, token: String): Unit = {
    handler = factory.create()
    val packet = serializer.serialize(JsonViewServerMessage(RequestId.oneNew(), "", "", "", LoginRequest("TOKEN", user)))
    handler.handle(packet, channel)

    channel.popMsg match {
      case Some(msgPacket) =>
        val msg = serializer.deserialize(msgPacket)
        clientSessionId = ClientSessionId(msg.sessionId, user)
    }
  }

  override def overrideViewPortDef(table: String, vpDefFunc: (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef): Unit = {
    viewPortContainer.addViewPortDefinition(table, vpDefFunc)
  }

  override def getViewPortRpcServiceProxy[TYPE : _root_.scala.reflect.ClassTag](viewport: ViewPort):TYPE = {

    val interceptor = new RpcDynamicProxy(viewport, handler, serializer, session, "FOO", "BAR")

    val clazz: Class[_] = classTag[TYPE].runtimeClass

    val proxyInstance = java.lang.reflect.Proxy.newProxyInstance(
                                  getClass.getClassLoader,
                                  Array[Class[_]](clazz),
                                  interceptor).asInstanceOf[TYPE]

    proxyInstance
  }

  override def requestContext: RequestContext = {
    RequestContext(RequestId.oneNew(), clientSessionId, queue, "TOKEN")
  }

  override def registerPlugin(plugin: Plugin): Unit = pluginRegistry.registerPlugin(plugin)




}
