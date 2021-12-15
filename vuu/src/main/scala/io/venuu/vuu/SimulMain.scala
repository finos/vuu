package io.venuu.vuu

import io.venuu.toolbox.jmx.{JmxInfra, MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{Clock, DefaultClock}
import io.venuu.vuu.core.module.metrics.MetricsModule
import io.venuu.vuu.core.module.simul.SimulationModule
import io.venuu.vuu.core.module.vui.VuiStateModule
import io.venuu.vuu.core.{VuuServer, VuuServerConfig, VuuWebSocketOptions}
import io.venuu.vuu.net.http.VuuHttp2ServerOptions
import io.venuu.vuu.state.{MemoryBackedVuiStateStore, VuiHeader, VuiJsonState, VuiState}

/*
//to allow self signed certs
chrome://flags/#allow-insecure-localhost

 */

object SimulMain extends App {

  JmxInfra.enableJmx()

  implicit val metrics: MetricsProvider = new MetricsProviderImpl
  implicit val clock: Clock = new DefaultClock
  implicit val lifecycle: LifecycleContainer = new LifecycleContainer

  val store = new MemoryBackedVuiStateStore()

  store.add(VuiState(VuiHeader("chris", "latest", "chris.latest", clock.now()), VuiJsonState("{ uiState : ['chris','foo'] }")))

  lifecycle.autoShutdownHook()

  val config = VuuServerConfig(
    VuuHttp2ServerOptions()
      //.withWebRoot("../vuu/src/main/resources/www")
      .withWebRoot("vuu-ui/packages/app-vuu-example/public")
      .withSsl("vuu/src/main/resources/certs/cert.pem",
        "vuu/src/main/resources/certs/key.pem")
      .withDirectoryListings(true)
      .withPort(8443),
    VuuWebSocketOptions()
      .withUri("websocket")
      .withWsPort(8090)
  ).withModule(SimulationModule())
    .withModule(MetricsModule())
    .withModule(VuiStateModule(store))

  val vuuServer = new VuuServer(config)

  //LifecycleGraphviz("vuu", lifecycle.dependencyGraph)

  lifecycle.start()

  vuuServer.join()
}
