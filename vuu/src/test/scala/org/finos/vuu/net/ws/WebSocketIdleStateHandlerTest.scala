package org.finos.vuu.net.ws

import io.netty.channel.{Channel, ChannelHandlerContext}
import io.netty.handler.timeout.IdleStateEvent
import org.mockito.Mockito.{never, verify, when}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatestplus.mockito.MockitoSugar

import java.net.InetSocketAddress
import java.time.Duration

class WebSocketIdleStateHandlerTest extends AnyFeatureSpec with GivenWhenThen with Matchers with MockitoSugar {

  Feature("WebSocket Idle State Handling for Slowloris Mitigation") {

    Scenario("READER_IDLE event is triggered") {
      Given("a WebSocketIdleStateHandler")
      val handler = new WebSocketIdleStateHandler(Duration.ofSeconds(1))

      And("a mocked ChannelHandlerContext and Channel")
      val mockCtx = mock[ChannelHandlerContext]
      val mockChannel = mock[Channel]
      when(mockCtx.channel()).thenReturn(mockChannel)
      when(mockChannel.remoteAddress()).thenReturn(new InetSocketAddress("127.0.0.1", 12345))

      When("channelIdle is called with a READER_IDLE event")
      handler.channelIdle(mockCtx, IdleStateEvent.READER_IDLE_STATE_EVENT)

      Then("the connection is closed")
      verify(mockCtx).close()
    }

    Scenario("ALL_IDLE event is triggered") {
      Given("a WebSocketIdleStateHandler")
      val handler = new WebSocketIdleStateHandler(Duration.ofSeconds(1))

      And("a mocked ChannelHandlerContext and Channel")
      val mockCtx = mock[ChannelHandlerContext]
      val mockChannel = mock[Channel]
      when(mockCtx.channel()).thenReturn(mockChannel)
      when(mockChannel.remoteAddress()).thenReturn(new InetSocketAddress("127.0.0.1", 12345))

      When("channelIdle is called with an ALL_IDLE event")
      handler.channelIdle(mockCtx, IdleStateEvent.ALL_IDLE_STATE_EVENT)

      Then("the connection is closed")
      verify(mockCtx).close()
    }

    Scenario("WRITER_IDLE event is triggered") {
      Given("a WebSocketIdleStateHandler")
      val handler = new WebSocketIdleStateHandler(Duration.ofSeconds(1))

      And("a mocked ChannelHandlerContext and Channel")
      val mockCtx = mock[ChannelHandlerContext]
      val mockChannel = mock[Channel]
      when(mockCtx.channel()).thenReturn(mockChannel)
      when(mockChannel.remoteAddress()).thenReturn(new InetSocketAddress("127.0.0.1", 12345))

      When("channelIdle is called with a WRITER_IDLE event")
      handler.channelIdle(mockCtx, IdleStateEvent.WRITER_IDLE_STATE_EVENT)

      Then("the connection is not closed")
      verify(mockCtx, never()).close()
    }

    Scenario("Channel context has null channel (resilience test)") {
      Given("a WebSocketIdleStateHandler")
      val handler = new WebSocketIdleStateHandler(Duration.ofSeconds(1))

      And("a mocked ChannelHandlerContext returning null channel")
      val mockCtx = mock[ChannelHandlerContext]
      when(mockCtx.channel()).thenReturn(null)

      When("channelIdle is called with a READER_IDLE event")
      handler.channelIdle(mockCtx, IdleStateEvent.READER_IDLE_STATE_EVENT)

      Then("the context is still safely closed without throwing NPE")
      verify(mockCtx).close()
    }

  }
}
