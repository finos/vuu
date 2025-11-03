package org.finos.vuu.api

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.TestFriendlyClock
import org.finos.vuu.core.CoreServerApiHandler
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.table.TableContainer
import org.finos.vuu.feature.inmem.{VuuInMemPlugin, VuuInMemPluginType}
import org.finos.vuu.net.{ClientSessionId, HeartBeatResponse, RequestContext}
import org.finos.vuu.plugin.DefaultPluginRegistry
import org.finos.vuu.provider.{JoinTableProviderImpl, ProviderContainer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.viewport.ViewPortContainer
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.{BeforeAndAfterEach, GivenWhenThen}

class CoreServerApiTest extends AnyFeatureSpec with BeforeAndAfterEach with GivenWhenThen {
  var coreServerApi: CoreServerApiHandler = _
  override def beforeEach(): Unit = {
    implicit val clock: TestFriendlyClock = new TestFriendlyClock(1311544800L)
    implicit val lifecycle: LifecycleContainer = new LifecycleContainer
    implicit val metrics: MetricsProvider = new MetricsProviderImpl
    val joinTableProvider = JoinTableProviderImpl()
    val tableContainer = new TableContainer(joinTableProvider)
    val providerContainer = new ProviderContainer(joinTableProvider)
    val pluginRegistry = new DefaultPluginRegistry
    pluginRegistry.registerPlugin(new VuuInMemPlugin)

    val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer, pluginRegistry)
    coreServerApi = new CoreServerApiHandler(viewPortContainer, tableContainer, providerContainer)
  }

  Feature("Check core server api") {
    Scenario("should process heartbeat successfully") {
      Given("a heart beat response")
      val heartBeatResponse = HeartBeatResponse(100000)
      val requestContext = RequestContext("reqId", VuuUser("user"),
        ClientSessionId("sessionId", "channel"), new OutboundRowPublishQueue())
      val maybeMessage = coreServerApi.process(heartBeatResponse)(requestContext)

      Then("core server api should process successfully")
      assert(maybeMessage.isEmpty)
    }
  }

}
