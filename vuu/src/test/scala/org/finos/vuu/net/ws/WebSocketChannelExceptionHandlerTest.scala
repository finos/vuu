package org.finos.vuu.net.ws

import io.netty.channel.ChannelHandlerContext
import org.scalamock.scalatest.MockFactory
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class WebSocketChannelExceptionHandlerTest extends AnyFeatureSpec with GivenWhenThen with Matchers with MockFactory {

  Feature("WebSocket Channel Exception Handling") {

    Scenario("An exception is caught in the Netty pipeline") {

      Given("a WebSocketChannelExceptionHandler")
      val handler = new WebSocketChannelExceptionHandler()

      And("a mocked ChannelHandlerContext")
      val mockCtx = mock[ChannelHandlerContext]
      val cause = new RuntimeException("Unexpected disconnect")

      And("we expect the channel to be closed")
      (mockCtx.close _).expects().once()

      When("exceptionCaught is triggered")
      handler.exceptionCaught(mockCtx, cause)

      Then("the connection is terminated successfully")
    }

    Scenario("A null exception is passed to the handler") {

      Given("the same exception handler")
      val handler = new WebSocketChannelExceptionHandler()
      val mockCtx = mock[ChannelHandlerContext]

      And("we still expect the channel to close regardless of the cause")
      (mockCtx.close _).expects().once()

      When("exceptionCaught is triggered with a null cause")
      handler.exceptionCaught(mockCtx, null)

      Then("the context is still closed safely")
    }
  }
}