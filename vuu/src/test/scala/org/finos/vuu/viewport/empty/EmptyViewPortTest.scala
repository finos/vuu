package org.finos.vuu.viewport.empty

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.core.module.{TableDefContainer, TestModule}
import org.finos.vuu.test.VuuServerTestCase
import org.finos.vuu.viewport.SizeUpdateType

class EmptyViewPortTest extends VuuServerTestCase {

  Feature("Check behaviour when we create empty viewports") {

    Scenario("Verify when we open up empty viewport we receive a tables rows update") {

      implicit val clock: Clock = new TestFriendlyClock(10001L)
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer()
      implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())
      implicit val metricsProvider: MetricsProvider = new MetricsProviderImpl

      withVuuServer(TestModule()) {
        vuuServer =>

          vuuServer.login("testUser")

          val viewport = vuuServer.createViewPort("TEST", "instruments")

          vuuServer.runOnce()

          val updates = viewport.outboundQ.popUpTo(10)

          updates.length should equal(1)
          updates.head.vpUpdate should equal(SizeUpdateType)
          updates.head.size should equal(0)

          vuuServer.runOnce()

          val updates2 = viewport.outboundQ.popUpTo(10)

          updates2.length should equal(0)
      }
    }

  }

}
