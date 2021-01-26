/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 11/12/2015.

  */
package io.venuu.vuu

import io.venuu.toolbox.jmx.{JmxInfra, MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{DefaultClock, Clock}
import io.venuu.vuu.core.module.metrics.MetricsModule
import io.venuu.vuu.core.module.simul.SimulationModule
import io.venuu.vuu.core.{ViewServer, ViewServerConfig}

/*
-Xbootclasspath/p:/Users/chris/.m2/repository/org/mortbay/jetty/alpn/alpn-boot/8.1.3.v20150130/alpn-boot-8.1.3.v20150130.jar -XX:+UnlockCommercialFeatures -XX:+FlightRecorder -XX:+UseG1GC -verbosegc
 */

object SimulMain extends App{

  JmxInfra.enableJmx()

  implicit val metrics: MetricsProvider = new MetricsProviderImpl
  implicit val timeProvider: Clock = new DefaultClock
  implicit val lifecycle: LifecycleContainer = new LifecycleContainer

  lifecycle.autoShutdownHook()

  val config = ViewServerConfig(8080, 8443, 8090, "/Users/chris/GitHub/react-enterprise/examples")
                  .withModule(SimulationModule())
                  .withModule(MetricsModule())

  val viewServer = new ViewServer(config)

  lifecycle.start()

  viewServer.join()
}
