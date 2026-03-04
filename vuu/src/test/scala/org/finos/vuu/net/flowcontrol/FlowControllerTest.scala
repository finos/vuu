package org.finos.vuu.net.flowcontrol

import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.net.{ClientSessionId, HeartBeatResponse, VsMsg}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class FlowControllerTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  Feature("Flow Control Management") {

    val sessionId = ClientSessionId("sessionId", "channelId")

    Scenario("Initial state should trigger a heartbeat immediately") {
      Given("a new FlowController with no messages processed")
      implicit val clock: TestFriendlyClock = new TestFriendlyClock(1000)
      val controller = DefaultFlowController(sessionId)

      When("shouldSend is called")
      val result = controller.shouldSend()

      Then("it should return SendHeartbeat")
      result shouldBe SendHeartbeat()
    }

    Scenario("Normal message flow should return BatchSize") {
      Given("a FlowController that just processed a message")
      implicit val clock: TestFriendlyClock = new TestFriendlyClock(1000)
      val controller = DefaultFlowController(sessionId)

      // Initial heartbeat to clear the -1 state
      controller.shouldSend()
      controller.process(null) // lastMsgTime = 1000

      When("only 2 seconds have passed since the last message")
      clock.advanceBy(2000)
      val result = controller.shouldSend()

      Then("it should return BatchSize(300)")
      result shouldBe BatchSize(300)
    }

    Scenario("Heartbeat throttling (less than 1s since last heartbeat)") {
      Given("a FlowController that just sent a heartbeat")
      implicit val clock: TestFriendlyClock = new TestFriendlyClock(1000)
      val controller = DefaultFlowController(sessionId)

      controller.process(null)
      clock.advanceBy(6000) // Move into heartbeat range (> 5s)
      controller.shouldSend() shouldBe SendHeartbeat() // Heartbeat sent at T=7000

      When("we check again only 500ms later")
      clock.advanceBy(500)
      val result = controller.shouldSend()

      Then("it should return BatchSize because of the 1s throttle")
      result shouldBe BatchSize(300)
    }

    Scenario("Entering the warning and disconnect zones") {
      Given("a FlowController that hasn't seen a message for a while")
      implicit val clock: TestFriendlyClock = new TestFriendlyClock(1000)
      val controller = DefaultFlowController(sessionId)
      controller.process(null) // lastMsgTime = 1000

      When("12 seconds have passed (Warning Zone)")
      clock.advanceBy(12000)
      val heartbeatResult = controller.shouldSend()

      Then("it should still send a heartbeat (and log a warning)")
      heartbeatResult shouldBe SendHeartbeat()

      When("over 15 seconds have passed (Disconnect Zone)")
      clock.advanceBy(4000) // Total 16s since last message
      val disconnectResult = controller.shouldSend()

      Then("it should return Disconnect")
      disconnectResult shouldBe Disconnect()
    }
  }
}


