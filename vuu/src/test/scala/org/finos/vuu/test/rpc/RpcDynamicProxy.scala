package org.finos.vuu.test.rpc

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.net.{ClientSessionId, JsonViewServerMessage, MessageBody, ViewPortMenuRpcResponse, ViewPortRpcCall, ViewPortRpcResponse, ViewServerHandler}
import org.finos.vuu.net.json.Serializer
import org.finos.vuu.test.impl.TestChannel
import org.finos.vuu.viewport.{ViewPort, ViewPortAction}

import java.lang.reflect.{InvocationHandler, Method}

class RpcDynamicProxy(viewport: ViewPort,
                      handler: ViewServerHandler, serializer: Serializer[String, MessageBody],
                      session: ClientSessionId, token: String, user: String) extends InvocationHandler with StrictLogging {

  final val channel = new TestChannel

  override def invoke(proxy: Any, method: Method, args: Array[AnyRef]): AnyRef = {

    val requestId = RequestId.oneNew()

    val argsForMessage = args.map(_.asInstanceOf[Any]).dropRight(1)

    val rpcMessage = ViewPortRpcCall(viewport.id, method.getName, argsForMessage, Map())

    val msg = JsonViewServerMessage(requestId, session.sessionId, token, user, rpcMessage)

    val packet = serializer.serialize(msg)

    logger.info("Calling RPC with packet:" + packet)

    handler.handle(packet, channel)

    channel.popMsg match {
      case Some(packet) =>
        logger.info("Got RPC response packet:" + packet)
        val responseMsg = serializer.deserialize(packet)
        responseMsg.body.asInstanceOf[ViewPortRpcResponse].action
      case None =>
        null
    }
  }
}
