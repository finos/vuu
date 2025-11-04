package org.finos.vuu.net.flowcontrol

import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.net.{HeartBeatResponse, VsMsg}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class FlowControllerTest extends AnyFeatureSpec with Matchers {

  Feature("check flow control logic"){

    Scenario("check simple flow controller"){

      given clock: Clock = new TestFriendlyClock(100L)

      val flowController = new DefaultFlowController

      flowController.shouldSend() shouldBe(SendHeartbeat())

      flowController.process(VsMsg("", "", HeartBeatResponse(1L)))

      flowController.shouldSend() shouldBe(BatchSize(300))

      clock.sleep(5001)

      flowController.shouldSend() shouldBe(SendHeartbeat())

      clock.sleep(15000)

      flowController.shouldSend() shouldBe(Disconnect())
    }
  }
}
