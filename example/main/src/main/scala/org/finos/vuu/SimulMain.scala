package org.finos.vuu

import com.typesafe.config.{Config, ConfigFactory}
import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.jmx.{JmxInfra, MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core._
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.module.authn.AuthNModule
import org.finos.vuu.core.module.auths.PermissionModule
import org.finos.vuu.core.module.basket.BasketModule
import org.finos.vuu.core.module.editable.EditableModule
import org.finos.vuu.core.module.metrics.MetricsModule
import org.finos.vuu.core.module.price.PriceModule
import org.finos.vuu.core.module.simul.SimulationModule
import org.finos.vuu.core.module.typeahead.TypeAheadModule
import org.finos.vuu.core.module.vui.VuiStateModule
import org.finos.vuu.example.rest.client.{HttpClient, StubbedBackend}
import org.finos.vuu.example.rest.module.RestModule
import org.finos.vuu.example.virtualtable.module.VirtualTableModule
import org.finos.vuu.net.auth.AlwaysHappyAuthenticator
import org.finos.vuu.net.http.VuuHttp2ServerOptions
import org.finos.vuu.net.{AlwaysHappyLoginValidator, Authenticator, LoggedInTokenValidator}
import org.finos.vuu.order.oms.OmsApi
import org.finos.vuu.plugin.virtualized.VirtualizedTablePlugin
import org.finos.vuu.state.MemoryBackedVuiStateStore

/*
//to allow self signed certs
chrome://flags/#allow-insecure-localhost
 */

object SimulMain extends App with StrictLogging {

  JmxInfra.enableJmx()

  implicit val metrics: MetricsProvider = new MetricsProviderImpl
  implicit val clock: Clock = new DefaultClock
  implicit val lifecycle: LifecycleContainer = new LifecycleContainer
  implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())

  val omsApi = OmsApi()

  logger.info("[VUU] Starting...")

  val store = new MemoryBackedVuiStateStore()

  lifecycle.autoShutdownHook()

  val authenticator: Authenticator = new AlwaysHappyAuthenticator
  val loginTokenValidator: LoggedInTokenValidator = new LoggedInTokenValidator

  private val defaultConfig = ConfigFactory.load()

  val config = VuuServerConfig(
    httpServerOptions(defaultConfig),
    webSocketOptions(defaultConfig),
    VuuSecurityOptions()
      .withAuthenticator(authenticator)
      .withLoginValidator(new AlwaysHappyLoginValidator),
    VuuThreadingOptions()
      .withViewPortThreads(4)
      .withTreeThreads(4)
  ).withModule(PriceModule())
    .withModule(SimulationModule())
    .withModule(MetricsModule())
    .withModule(VuiStateModule(store))
    .withModule(TypeAheadModule())
    .withModule(AuthNModule(authenticator, loginTokenValidator))
    .withModule(EditableModule())
    .withModule(PermissionModule())
    .withModule(BasketModule(omsApi))
    .withModule(RestModule(HttpClient(StubbedBackend()), defaultConfig.getConfig(ConfigKeys.restModuleConfig)))
    .withModule(VirtualTableModule())
    .withPlugin(VirtualizedTablePlugin)

  val vuuServer = new VuuServer(config)

  //  LifecycleGraphviz("vuu", lifecycle.dependencyGraph)

  lifecycle.start()

  logger.info("[VUU] Ready.")

  vuuServer.join()
}

object ConfigKeys {
  final val webroot = "vuu.webroot"
  final val sslEnabled = "vuu.ssl"
  final val certPath = "vuu.certPath"
  final val keyPath = "vuu.keyPath"
  final val restModuleConfig = "vuu.restModule"
}

object httpServerOptions {
  def apply(c: Config): VuuHttp2ServerOptions = {
    val options = VuuHttp2ServerOptions()
      //only specify webroot if we want to load the source locally, we'll load it from the jar
      //otherwise
      .withWebRoot(c.getString(ConfigKeys.webroot))
      //don't leave me on in prod pls....
      .withDirectoryListings(true)
      .withBindAddress("0.0.0.0")
      .withPort(8443)

    val sslEnabled = c.getBoolean(ConfigKeys.sslEnabled)
    if (sslEnabled) options.withSsl(c.getString(ConfigKeys.certPath), c.getString(ConfigKeys.keyPath)) else options
  }
}

object webSocketOptions {
  def apply(c: Config): VuuWebSocketOptions = {
    val options = VuuWebSocketOptions()
      .withUri("websocket")
      .withWsPort(8090)
      .withBindAddress("0.0.0.0")

    val sslEnabled = c.getBoolean(ConfigKeys.sslEnabled)
    if (sslEnabled) options.withWss(c.getString(ConfigKeys.certPath), c.getString(ConfigKeys.keyPath)) else options
  }
}
