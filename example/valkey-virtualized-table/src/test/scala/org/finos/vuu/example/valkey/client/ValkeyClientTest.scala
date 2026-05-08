package org.finos.vuu.example.valkey.client

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.example.valkey.ValkeyTestBase
import org.finos.vuu.example.valkey.client.options.ValkeyClientOptions


class ValkeyClientTest extends ValkeyTestBase {

  Feature("Test we can connect to a remote Valkey") {

    Scenario("Can insert and retrieve by key") {

      given metrics: MetricsProvider = MetricsProviderImpl()
      given timeProvider: Clock = DefaultClock()
      given lifecycle: LifecycleContainer = LifecycleContainer()

      val client = ValkeyClient(ValkeyClientOptions()
        .withNode(container.getHost, container.getPort)
        .withHostAndPortMapper(container.getHostAndPortMapper))
      lifecycle.start()

      var start = timeProvider.now()

      val keys = (1 to 1_000_000).map(i => s"A$i").toArray

      logger.info("Begin insertion")

      insertOrders(client, keys)

      logger.info(s"Insert completed in ${timeProvider.now() - start} ms")

      start = timeProvider.now()

      iterateOrders(client, keys)

      logger.info(s"Checked all records in ${timeProvider.now() - start} ms")

      lifecycle.thread.stop()
      lifecycle.stop()
    }


  }

}
