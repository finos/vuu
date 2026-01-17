package org.finos.vuu.net

import io.netty.channel.Channel
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.util.PublishQueue
import org.finos.vuu.viewport.ViewPortUpdate
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class ClientSessionContainerTest extends AnyFeatureSpec with Matchers {

  class MockHandler extends MessageHandler {
    override def sendUpdates(): Unit = {}

    override def channel: Channel = ???

    override def outboundQueue: PublishQueue[ViewPortUpdate] = ???

    override def handle(msg: ViewServerMessage): Option[ViewServerMessage] = ???
  }

  Feature("Session Management and Capacity Limiting") {

    val maxSessions = 2
    val user = VuuUser("test-user")
    val otherUser = VuuUser("other-user")

    Scenario("Registering sessions within the limit") {
      val container = ClientSessionContainer(maxSessions)

      val result1 = container.register(user, ClientSessionId("sid-1", "channel"), new MockHandler())
      val result2 = container.register(user, ClientSessionId("sid-2", "channel"), new MockHandler())

      info("Both registrations should succeed")
      result1 shouldBe Right(())
      result2 shouldBe Right(())
      container.getSessions should have size 2
    }

    Scenario("Exceeding the maximum allowed sessions for a single user") {
      val container = ClientSessionContainer(maxSessions)

      // Fill up to limit
      container.register(user, ClientSessionId("sid-1", "channel"), new MockHandler())
      container.register(user, ClientSessionId("sid-2", "channel"), new MockHandler())

      info("The third registration should return a Left error")
      val result3 = container.register(user, ClientSessionId("sid-3", "channel"), new MockHandler())

      result3.isLeft shouldBe true
      result3 shouldBe Left("User session limit exceeded")
      container.getSessions should have size 2
    }

    Scenario("Registration limits are per-user, not global") {
      val container = ClientSessionContainer(maxSessions)

      container.register(user, ClientSessionId("user1-s1", "channel"), new MockHandler())
      container.register(user, ClientSessionId("user1-s2", "channel"), new MockHandler())

      info("User 2 should still be able to register despite User 1 being at limit")
      val resultOther = container.register(otherUser, ClientSessionId("user2-s1", "channel"), new MockHandler())

      resultOther shouldBe Right(())
      container.getSessions should have size 3
    }

    Scenario("Removing a session should allow a new one to be registered") {
      val container = ClientSessionContainer(maxSessions)
      val sid1 = ClientSessionId("sid-1", "channel")
      val sid2 = ClientSessionId("sid-2", "channel")
      val sid3 = ClientSessionId("sid-3", "channel")

      container.register(user, sid1, new MockHandler())
      container.register(user, sid2, new MockHandler())

      info("Remove one session")
      container.remove(user, sid1)
      container.getSessions should not contain sid1

      info("A new session should now be accepted")
      val result = container.register(user, sid3, new MockHandler())
      result shouldBe Right(())
      container.getSessions should contain (sid3)
    }

    Scenario("Retrieving a message handler for an active session") {
      val container = ClientSessionContainer(maxSessions)
      val sid = ClientSessionId("sid-1", "channel")
      val handler = new MockHandler()

      container.register(user, sid, handler)

      container.getHandler(sid) shouldBe Some(handler)
      container.getHandler(ClientSessionId("non-existent", "channel")) shouldBe None
    }
  }
}