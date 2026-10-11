package org.finos.vuu.net.ws

import io.netty.channel.ChannelPipeline
import io.netty.channel.socket.SocketChannel
import org.finos.vuu.core.VuuWebSocketOptions
import org.finos.vuu.net.ViewServerHandlerFactory
import org.mockito.ArgumentMatchers.{any, eq as eqTo}
import org.mockito.Mockito.{verify, when}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatestplus.mockito.MockitoSugar

class WebSocketServerInitializerTest extends AnyFeatureSpec with GivenWhenThen with Matchers with MockitoSugar {

  Scenario("WebSocketServerInitializer configures idle-handler in channel pipeline") {

    Given("a WebSocketServerInitializer")
    val options = VuuWebSocketOptions()
    val factory = mock[ViewServerHandlerFactory]
    val initializer = new WebSocketServerInitializer(options, factory)

    And("a mocked SocketChannel and ChannelPipeline")
    val mockChannel = mock[SocketChannel]
    val mockPipeline = mock[ChannelPipeline]
    when(mockChannel.pipeline()).thenReturn(mockPipeline)

    When("initChannel is executed")
    initializer.initChannel(mockChannel)

    Then("the idle-handler is added to the pipeline")
    verify(mockPipeline).addLast(eqTo("idle-handler"), any[WebSocketIdleStateHandler]())
  }

}
