package io.venuu.vuu.net.flowcontrol

import io.venuu.toolbox.time.TestFriendlyTimeProvider
import io.venuu.vuu.net.{HeartBeatResponse, VsMsg}
import org.scalatest._

/**
  * Created by chris on 10/01/2016.
  */
class FlowControllerTest extends FeatureSpec with Matchers {

  feature("check flow control logic"){

    scenario("check simple flow controller"){

      implicit val timeProvider = new TestFriendlyTimeProvider(100l)

      val flowController = new DefaultFlowController

      flowController.shouldSend() shouldBe(SendHeartbeat())

      flowController.process(VsMsg("", "", "", "", HeartBeatResponse(1l)))

      flowController.shouldSend() shouldBe(BatchSize(300))

      timeProvider.sleep(5001)

      flowController.shouldSend() shouldBe(SendHeartbeat())

      timeProvider.sleep(15000)

      flowController.shouldSend() shouldBe(Disconnect())
    }
  }
}
