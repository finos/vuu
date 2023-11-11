package org.finos.vuu.test.rpc

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.net.{ClientSessionId, JsonViewServerMessage, MessageBody, ViewPortEditCellRpcCall, ViewPortMenuRpcResponse, ViewPortRpcCall, ViewPortRpcResponse, ViewServerHandler}
import org.finos.vuu.net.json.Serializer
import org.finos.vuu.test.impl.TestChannel
import org.finos.vuu.viewport.{ViewPort, ViewPortAction, ViewPortEditCellAction}

import java.lang.reflect.{InvocationHandler, Method}

class RpcDynamicProxy(viewport: ViewPort,
                      handler: ViewServerHandler, serializer: Serializer[String, MessageBody],
                      session: ClientSessionId, token: String, user: String) extends InvocationHandler with StrictLogging {

  final val channel = new TestChannel

  private def processEditCellAction(proxy: Any, method: Method): ViewPortEditCellAction = {
    new ViewPortEditCellAction("", (key, col, theValue, vp, session) => {

      val requestId = RequestId.oneNew()
      val rpcMessage = ViewPortEditCellRpcCall(viewport.id, key, col, theValue)
      val vpMsg = JsonViewServerMessage(requestId, session.sessionId, token, user, rpcMessage)

      val packet = serializer.serialize(vpMsg)

      logger.info("Calling RPC with packet:" + packet)

      handler.handle(packet, channel)

      channel.popMsg match {
        case Some(packet) =>
          logger.info("Got RPC response packet:" + packet)
          val responseMsg = serializer.deserialize(packet)
          //responseMsg.body.asInstanceOf[ViewPort]
          null
        case None =>
          null
      }

    })
  }

  private def processRpcCall(proxy: Any, method: Method, args: Array[AnyRef]): AnyRef = {
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

  override def invoke(proxy: Any, method: Method, args: Array[AnyRef]): AnyRef = {

    method.getName match {
      case "editCellAction" => processEditCellAction(proxy, method)
      case x: String => processRpcCall(proxy, method, args)
    }

  }
}
