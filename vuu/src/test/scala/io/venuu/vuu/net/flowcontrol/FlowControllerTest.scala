package io.venuu.vuu.net.flowcontrol

import io.venuu.toolbox.time.TestFriendlyClock
import io.venuu.vuu.net.{HeartBeatResponse, VsMsg}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class FlowControllerTest extends AnyFeatureSpec with Matchers {

  Feature("check flow control logic"){

    Scenario("check simple flow controller"){

      implicit val clock = new TestFriendlyClock(100l)

      val flowController = new DefaultFlowController

      flowController.shouldSend() shouldBe(SendHeartbeat())

      flowController.process(VsMsg("", "", "", "", HeartBeatResponse(1l)))

      flowController.shouldSend() shouldBe(BatchSize(300))

      clock.sleep(5001)

      flowController.shouldSend() shouldBe(SendHeartbeat())

      clock.sleep(15000)

      flowController.shouldSend() shouldBe(Disconnect())
    }
  }
}
