package org.finos.vuu.net.ws

import io.netty.channel.ChannelHandlerContext
import org.mockito.Mockito
import org.mockito.Mockito.verify
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatestplus.mockito.MockitoSugar

class WebSocketChannelExceptionHandlerTest extends AnyFeatureSpec with GivenWhenThen with Matchers with MockitoSugar {

  Feature("WebSocket Channel Exception Handling") {

    Scenario("An exception is caught in the Netty pipeline") {

      Given("a WebSocketChannelExceptionHandler")
      val handler = new WebSocketChannelExceptionHandler()

      And("a mocked ChannelHandlerContext")
      val mockCtx = mock[ChannelHandlerContext]
      val cause = new RuntimeException("Unexpected disconnect")

      When("exceptionCaught is triggered")
      handler.exceptionCaught(mockCtx, cause)

      Then("the connection is terminated successfully")
      verify(mockCtx).close()
    }

    Scenario("A null exception is passed to the handler") {

      Given("the same exception handler")
      val handler = new WebSocketChannelExceptionHandler()
      val mockCtx = mock[ChannelHandlerContext]

      When("exceptionCaught is triggered with a null cause")
      handler.exceptionCaught(mockCtx, null)

      Then("the context is still closed safely")
      verify(mockCtx).close()
    }
  }
}