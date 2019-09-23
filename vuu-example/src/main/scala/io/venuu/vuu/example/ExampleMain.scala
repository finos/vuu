package io.venuu.vuu.example

import io.venuu.toolbox.jmx.{JmxInfra, MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{DefaultTimeProvider, TimeProvider}
import io.venuu.vuu.core.module.simul.SimulationModule
import io.venuu.vuu.core.{ViewServer, ViewServerConfig}

object ExampleMain extends App{

  JmxInfra.enableJmx()

  implicit val metrics: MetricsProvider = new MetricsProviderImpl
  implicit val timeProvider: TimeProvider = new DefaultTimeProvider
  implicit val lifecycle: LifecycleContainer = new LifecycleContainer

  lifecycle.autoShutdownHook()

  val config = ViewServerConfig(8080, 8443, 8090, "/Users/chris/GitHub/react-enterprise/examples")
    .withModule(SimulationModule())

  val viewServer = new ViewServer(config)

  lifecycle.start()

  viewServer.join()
}