package org.finos.vuu.test.impl

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{JoinTableDef, SessionTableDef, TableDef, ViewPortDef}
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.module.*
import org.finos.vuu.core.table.{DataTable, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.core.{AbstractVuuServer, CoreServerApiHandler}
import org.finos.vuu.feature.inmem.VuuInMemPlugin
import org.finos.vuu.net.*
import org.finos.vuu.net.auth.LoginTokenService
import org.finos.vuu.net.flowcontrol.FlowControllerFactory
import org.finos.vuu.net.json.{CoreJsonSerializationMixin, JsonVsSerializer}
import org.finos.vuu.net.rest.RestService
import org.finos.vuu.net.rpc.JsonSubTypeRegistry
import org.finos.vuu.plugin.{DefaultPluginRegistry, Plugin}
import org.finos.vuu.provider.*
import org.finos.vuu.test.TestVuuServer
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.viewport.*

import java.util.UUID
import scala.reflect.classTag

class TestVuuServerImpl(val modules: List[ViewServerModule])(implicit clock: Clock, lifecycle: LifecycleContainer, metrics: MetricsProvider) extends TestVuuServer with LifecycleEnabled with StrictLogging {

  private final val vuuServerId: String = UUID.randomUUID().toString

  private val serializer: JsonVsSerializer = JsonVsSerializer()

  JsonSubTypeRegistry.register(classOf[MessageBody], classOf[CoreJsonSerializationMixin])
  JsonSubTypeRegistry.register(classOf[ViewPortAction], classOf[ViewPortActionMixin])

  val sessionContainer: ClientSessionContainer = new ClientSessionContainerImpl(1)

  final val loginTokenService: LoginTokenService = LoginTokenService()

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

  val factory = new ViewServerHandlerFactoryImpl(loginTokenService, sessionContainer, serverApi, moduleContainer, flowControllerFactory, vuuServerId)

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

  private def registerModule(module: ViewServerModule): AbstractVuuServer = {

    val vs = this

    val realized = new RealizedViewServerModule {
      override def restServices: List[RestService] = module.restServicesUnrealized.map(_.apply(vs))
      override def name: String = module.name
      override def tableDefContainer: TableDefContainer = module.tableDefContainer
      override def tableDefs: List[TableDef] = module.tableDefs
      override def serializationMixin: AnyRef = module.serializationMixin
      override def restServicesUnrealized: List[AbstractVuuServer => RestService] = module.restServicesUnrealized
      override def getProviderForTable(table: DataTable, viewserver: AbstractVuuServer)(implicit time: Clock, life: LifecycleContainer): Provider = {
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

  override def createViewPort(module: String, tableName: String, viewPortRange: ViewPortRange): ViewPort = {
    val table = tableContainer.getTable(tableName)
    val columns = ViewPortColumnCreator.create(table, table.getTableDef.getColumns.map(_.name).toList)
    val viewport = viewPortContainer.create(RequestId.oneNew(), user, session, queue, table, viewPortRange, columns)
    viewport
  }

  override def createViewPort(module: String, tableName: String): ViewPort = createViewPort(module, tableName, DefaultRange)
  
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
  var user: VuuUser = null;

  override def login(user: String): Unit = login(VuuUser(user))

  override def login(user: VuuUser): Unit = {
    this.user = user
    handler = factory.create()
    val token = loginTokenService.getToken(user)
    val packet = serializer.serialize(JsonViewServerMessage(RequestId.oneNew(), "", LoginRequest(token)))
    handler.handle(packet, channel)

    channel.popMsg match {
      case Some(msgPacket) =>
        val msg = serializer.deserialize(msgPacket)
        clientSessionId = ClientSessionId(msg.sessionId, channel.id().asLongText())
    }
  }

  override def overrideViewPortDef(table: String, vpDefFunc: (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef): Unit = {
    viewPortContainer.addViewPortDefinition(table, vpDefFunc)
  }

  override def requestContext: RequestContext = {
    RequestContext(RequestId.oneNew(), user, clientSessionId, queue)
  }

  override def registerPlugin(plugin: Plugin): Unit = pluginRegistry.registerPlugin(plugin)




}
