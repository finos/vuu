package org.finos.vuu.example.valkey.client

import com.dimafeng.testcontainers.ForAllTestContainer
import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.finos.vuu.example.valkey.ValkeyContainer
import org.finos.vuu.example.valkey.client.options.ValkeyClientOptions

class ValkeyClientTest
  extends AnyFeatureSpec with GivenWhenThen with Matchers with ForAllTestContainer {

  override val container: ValkeyContainer = ValkeyContainer()

  Feature("Test we can connect to a remote Valkey") {

    Scenario("Can send data on a round trip") {

      given metrics: MetricsProvider = MetricsProviderImpl()
      given timeProvider: Clock = DefaultClock()
      given lifecycle: LifecycleContainer = LifecycleContainer()

      val client = ValkeyClient(ValkeyClientOptions()
        .withNode(container.getHost, container.getPort))
      lifecycle.start()

      val testKey = "connection-test-key"
      val testValue = s"test-value-${java.util.UUID.randomUUID()}"

      client.execute(a => {
        a.set(testKey, testValue)
        a.get(testKey)
      }) shouldEqual testValue

      lifecycle.thread.stop()
      lifecycle.stop()
    }

  }

}
