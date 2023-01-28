package org.finos.vuu.api

import org.finos.toolbox.jmx.MetricsProviderImpl
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.TestFriendlyClock
import org.finos.vuu.core.CoreServerApiHander
import org.finos.vuu.core.table.TableContainer
import org.finos.vuu.net.{ClientSessionId, HeartBeatResponse, RequestContext}
import org.finos.vuu.provider.{JoinTableProviderImpl, ProviderContainer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.viewport.ViewPortContainer
import org.scalatest.{BeforeAndAfterEach, GivenWhenThen}
import org.scalatest.featurespec.AnyFeatureSpec

class CoreServerApiTest extends AnyFeatureSpec with BeforeAndAfterEach with GivenWhenThen {
  var coreServerApi: CoreServerApiHander = _
  override def beforeEach() {
    implicit val clock = new TestFriendlyClock(1311544800l)
    implicit val lifecycle = new LifecycleContainer
    implicit val metrics = new MetricsProviderImpl
    val joinTableProvider = JoinTableProviderImpl()
    val tableContainer = new TableContainer(joinTableProvider)
    val providerContainer = new ProviderContainer(joinTableProvider)
    val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer)
    coreServerApi = new CoreServerApiHander(viewPortContainer, tableContainer, providerContainer)
  }

  Feature("Check core server api") {
    Scenario("should process heartbeat successfully") {
      Given("a heart beat response")
      val heartBeatResponse = HeartBeatResponse(100000)
      val requestContext = RequestContext("reqId",
        ClientSessionId("sessionId", "user"), new OutboundRowPublishQueue(), new OutboundRowPublishQueue(), "token")
      val maybeMessage = coreServerApi.process(heartBeatResponse)(requestContext)

      Then("core server api should process successfully")
      assert(maybeMessage.isEmpty)
    }
  }

}
