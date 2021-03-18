/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 11/12/2015.

  */
package io.venuu.vuu

import io.venuu.toolbox.jmx.{JmxInfra, MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{Clock, DefaultClock}
import io.venuu.vuu.core.module.metrics.MetricsModule
import io.venuu.vuu.core.module.simul.SimulationModule
import io.venuu.vuu.core.{VuuServer, VuuServerConfig, VuuWebSocketOptions}
import io.venuu.vuu.net.http.VuuHttp2ServerOptions

import java.nio.file.Paths

/*
-Xbootclasspath/p:/Users/chris/.m2/repository/org/mortbay/jetty/alpn/alpn-boot/8.1.3.v20150130/alpn-boot-8.1.3.v20150130.jar -XX:+UnlockCommercialFeatures -XX:+FlightRecorder -XX:+UseG1GC -verbosegc
 */

object SimulMain extends App{

  JmxInfra.enableJmx()

  implicit val metrics: MetricsProvider = new MetricsProviderImpl
  implicit val timeProvider: Clock = new DefaultClock
  implicit val lifecycle: LifecycleContainer = new LifecycleContainer

  lifecycle.autoShutdownHook()

  val config = VuuServerConfig(
    VuuHttp2ServerOptions()
      //.withWebRoot("../vuu/src/main/resources/www")
      .withWebRoot("../vuu-ui/dist/app")
      .withSsl("vuu/src/main/resources/certs/cert.pem",
               "vuu/src/main/resources/certs/key.pem")
      .withDirectoryListings(true)
      .withPort(8443),
    VuuWebSocketOptions()
      .withUri("websocket")
      .withWsPort(8090)
  ).withModule(SimulationModule())
   .withModule(MetricsModule())

  val viewServer = new VuuServer(config)
  lifecycle.start()
  viewServer.join()
}
