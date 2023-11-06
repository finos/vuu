package org.finos.vuu

import com.typesafe.config.ConfigFactory
import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.module.authn.AuthNModule
import org.finos.vuu.core.module.metrics.MetricsModule
import org.finos.vuu.core.module.simul.SimulationModule
import org.finos.vuu.core.module.typeahead.TypeAheadModule
import org.finos.vuu.core.module.vui.VuiStateModule
import org.finos.vuu.core.{VuuSecurityOptions, VuuServer, VuuServerConfig, VuuThreadingOptions, VuuWebSocketOptions}
import org.finos.vuu.net.{AlwaysHappyLoginValidator, Authenticator, LoggedInTokenValidator}
import org.finos.vuu.net.auth.AlwaysHappyAuthenticator
import org.finos.vuu.net.http.VuuHttp2ServerOptions
import org.finos.vuu.state.{MemoryBackedVuiStateStore, VuiHeader, VuiJsonState, VuiState}
import org.finos.toolbox.jmx.{JmxInfra, MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.module.auths.PermissionModule
import org.finos.vuu.core.module.basket.BasketModule
import org.finos.vuu.core.module.editable.EditableModule
import org.finos.vuu.core.module.price.PriceModule

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

  logger.info("[VUU] Starting...")

  val store = new MemoryBackedVuiStateStore()

  //store.add(VuiState(VuiHeader("chris", "latest", "chris.latest", clock.now()), VuiJsonState("{ uiState : ['chris','foo'] }")))

  lifecycle.autoShutdownHook()

  val authenticator: Authenticator = new AlwaysHappyAuthenticator
  val loginTokenValidator: LoggedInTokenValidator = new LoggedInTokenValidator

  val defaultConfig = ConfigFactory.load()

  //look in application.conf for default values
  val webRoot = defaultConfig.getString("vuu.webroot")
  val certPath = defaultConfig.getString("vuu.certPath")
  val keyPath = defaultConfig.getString("vuu.keyPath")

  val config = VuuServerConfig(
    VuuHttp2ServerOptions()
      //only specify webroot if we want to load the source locally, we'll load it from the jar
      //otherwise
      .withWebRoot(webRoot)
      .withSsl(certPath, keyPath)
      //don't leave me on in prod pls....
      .withDirectoryListings(true)
      .withBindAddress("0.0.0.0")
      .withPort(8443),
    VuuWebSocketOptions()
      .withUri("websocket")
      .withWsPort(8090)
      .withWss(certPath, keyPath)
      .withBindAddress("0.0.0.0"),
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
    .withModule(BasketModule())


  val vuuServer = new VuuServer(config)

  //  LifecycleGraphviz("vuu", lifecycle.dependencyGraph)

  lifecycle.start()

  logger.info("[VUU] Ready.")

  vuuServer.join()
}
