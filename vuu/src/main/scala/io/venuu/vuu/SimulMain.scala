package io.venuu.vuu

import com.typesafe.config.ConfigFactory
import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.jmx.{JmxInfra, MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{Clock, DefaultClock}
import io.venuu.vuu.core.module.authn.AuthNModule
import io.venuu.vuu.core.module.metrics.MetricsModule
import io.venuu.vuu.core.module.simul.SimulationModule
import io.venuu.vuu.core.module.typeahead.TypeAheadModule
import io.venuu.vuu.core.module.vui.VuiStateModule
import io.venuu.vuu.core.{VuuSecurityOptions, VuuServer, VuuServerConfig, VuuWebSocketOptions}
import io.venuu.vuu.net.{AlwaysHappyLoginValidator, Authenticator, LoggedInTokenValidator}
import io.venuu.vuu.net.auth.AlwaysHappyAuthenticator
import io.venuu.vuu.net.http.VuuHttp2ServerOptions
import io.venuu.vuu.state.{MemoryBackedVuiStateStore, VuiHeader, VuiJsonState, VuiState}

/*
//to allow self signed certs
chrome://flags/#allow-insecure-localhost
 */

object SimulMain extends App with StrictLogging {

  JmxInfra.enableJmx()

  implicit val metrics: MetricsProvider = new MetricsProviderImpl
  implicit val clock: Clock = new DefaultClock
  implicit val lifecycle: LifecycleContainer = new LifecycleContainer

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
      .withPort(8443),
    VuuWebSocketOptions()
      .withUri("websocket")
      .withWsPort(8090),
    VuuSecurityOptions()
      .withAuthenticator(authenticator)
      .withLoginValidator(new AlwaysHappyLoginValidator)
  ).withModule(SimulationModule())
    .withModule(MetricsModule())
    .withModule(VuiStateModule(store))
    .withModule(TypeAheadModule())
    .withModule(AuthNModule(authenticator, loginTokenValidator))


  val vuuServer = new VuuServer(config)

  //  LifecycleGraphviz("vuu", lifecycle.dependencyGraph)

  lifecycle.start()

  logger.info("[VUU] Ready.");

  vuuServer.join()
}
