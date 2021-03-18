package io.venuu.toolbox.net.ws

import io.netty.channel.ChannelHandlerContext
import io.netty.handler.codec.http.websocketx.{BinaryWebSocketFrame, TextWebSocketFrame}
import io.netty.util.CharsetUtil
import io.venuu.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.net.tcp.FreeTcpPortChecker
import io.venuu.toolbox.thread.Async
import io.venuu.toolbox.time.{Clock, DefaultClock}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.slf4j.LoggerFactory

import java.nio.ByteBuffer

class SimpleServerFrameHandlerFactory extends FrameHandlerFactory{
  override def create(ctx: ChannelHandlerContext): FrameHandler = new FrameHandler {
    private val logger = LoggerFactory.getLogger("server")

    override def handle(text: TextWebSocketFrame, context: ChannelHandlerContext): Unit = {
      logger.info("got text frame")
      context.channel().writeAndFlush(new TextWebSocketFrame(text.text()))
    }

    override def handle(binary: BinaryWebSocketFrame, context: ChannelHandlerContext): Unit = {
      val newFrame = binary.copy()
      context.channel().writeAndFlush(newFrame)
      logger.info("got binary frame")
    }
  }
}

/**
 * Created by chris on 25/10/2015.
 */
class WebSocketServerClientTest extends AnyFeatureSpec with Matchers {

  Feature("Check that we can create a websocket server and client"){

    Scenario("create web socket server and client and send data between"){

      implicit val clock: Clock = new DefaultClock
      implicit val lifecycle = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      //order of creation here is important
      val port = FreeTcpPortChecker.nextFree()
      val server = new WebSocketServer(port, new SimpleServerFrameHandlerFactory)
      val client = new WebSocketClient("ws://localhost:8090/websocket", port)

      //lifecycle registration is done in constructor of service classes, so sequence of create is important
      lifecycle.start()

      Async.waitTill( () => client.canWrite() )

      val text = "ChrisWasHere".getBytes(CharsetUtil.UTF_8)

      val bb = ByteBuffer.allocate(text.size).put(text)

      bb.flip()

      client.write(bb)

      val byteBuffer = client.awaitBinary()

      val returnArray = new Array[Byte](text.length)

      byteBuffer.get(returnArray)

      val stringBack = new String(returnArray, CharsetUtil.UTF_8)

      stringBack should equal("ChrisWasHere")

      client.write("Chris Was here")

      val msg = client.awaitMessage()

      msg should equal("Chris Was here")

      lifecycle.stop()
    }

  }
}
