package org.finos.vuu.test.rpc

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.net.{ClientSessionId, JsonViewServerMessage, MessageBody, RequestContext, RpcRequest, ViewPortAddRowRpcCall, ViewPortDeleteCellRpcCall, ViewPortDeleteRowRpcCall, ViewPortEditCellRpcCall, ViewPortEditRowRpcCall, ViewPortEditSubmitFormRpcCall, ViewServerHandler}
import org.finos.vuu.net.json.Serializer
import org.finos.vuu.net.rpc.RpcFunctionResult
import org.finos.vuu.test.impl.TestChannel
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.viewport.{ViewPort, ViewPortAction, ViewPortAddRowAction, ViewPortDeleteCellAction, ViewPortDeleteRowAction, ViewPortEditCellAction, ViewPortEditRowAction, ViewPortFormSubmitAction}

import java.lang.reflect.{InvocationHandler, Method}

class RpcDynamicProxy(viewport: ViewPort,
                      handler: ViewServerHandler, serializer: Serializer[String, MessageBody],
                      session: ClientSessionId, token: String, user: String) extends InvocationHandler with StrictLogging {

  final val channel = new TestChannel

  private def processEditCellAction(proxy: Any, method: Method): ViewPortEditCellAction = {
    ViewPortEditCellAction("", (key, col, theValue, vp, session) => {

      val requestId = RequestId.oneNew()
      val rpcMessage = ViewPortEditCellRpcCall(viewport.id, key, col, theValue)
      val vpMsg = JsonViewServerMessage(requestId, session.sessionId, token, user, rpcMessage)

      val packet = serializer.serialize(vpMsg)

      logger.trace("Calling RPC with packet:" + packet)

      handler.handle(packet, channel)

      channel.popMsg match {
        case Some(packet) =>
          logger.trace("Got RPC response packet:" + packet)
          val responseMsg = serializer.deserialize(packet)
          //responseMsg.body.asInstanceOf[ViewPort]
          null
        case None =>
          null
      }
    })
  }

  private def processEditRowAction(proxy: Any, method: Method): ViewPortEditRowAction = {
    ViewPortEditRowAction("", (key, map, vp, session) => {

      val requestId = RequestId.oneNew()
      val rpcMessage = ViewPortEditRowRpcCall(viewport.id, key, map.asInstanceOf[Map[String, Object]])
      val vpMsg = JsonViewServerMessage(requestId, session.sessionId, token, user, rpcMessage)

      val packet = serializer.serialize(vpMsg)

      logger.trace("Calling RPC with packet:" + packet)

      handler.handle(packet, channel)

      channel.popMsg match {
        case Some(packet) =>
          logger.trace("Got RPC response packet:" + packet)
          val responseMsg = serializer.deserialize(packet)
          //responseMsg.body.asInstanceOf[ViewPort]
          null
        case None =>
          null
      }
    })
  }

  private def processAddRowAction(proxy: Any, method: Method): ViewPortAddRowAction = {
    ViewPortAddRowAction("", (key, map, vp, session) => {

      val requestId = RequestId.oneNew()
      val rpcMessage = ViewPortAddRowRpcCall(viewport.id, key, map.asInstanceOf[Map[String, Object]])
      val vpMsg = JsonViewServerMessage(requestId, session.sessionId, token, user, rpcMessage)

      val packet = serializer.serialize(vpMsg)

      logger.trace("Calling RPC with packet:" + packet)

      handler.handle(packet, channel)

      channel.popMsg match {
        case Some(packet) =>
          logger.trace("Got RPC response packet:" + packet)
          val responseMsg = serializer.deserialize(packet)
          //responseMsg.body.asInstanceOf[ViewPort]
          null
        case None =>
          null
      }
    })
  }


  private def processDeleteRowAction(proxy: Any, method: Method): ViewPortDeleteRowAction = {
    ViewPortDeleteRowAction("", (key, vp, session) => {

      val requestId = RequestId.oneNew()
      val rpcMessage = ViewPortDeleteRowRpcCall(viewport.id, key)
      val vpMsg = JsonViewServerMessage(requestId, session.sessionId, token, user, rpcMessage)

      val packet = serializer.serialize(vpMsg)

      logger.trace("Calling RPC with packet:" + packet)

      handler.handle(packet, channel)

      channel.popMsg match {
        case Some(packet) =>
          logger.trace("Got RPC response packet:" + packet)
          val responseMsg = serializer.deserialize(packet)
          //responseMsg.body.asInstanceOf[ViewPort]
          null
        case None =>
          null
      }
    })
  }

  private def processFormSubmitAction(proxy: Any, method: Method): ViewPortFormSubmitAction = {
    ViewPortFormSubmitAction("", (vp, session) => {

      val requestId = RequestId.oneNew()
      val rpcMessage = ViewPortEditSubmitFormRpcCall(viewport.id)
      val vpMsg = JsonViewServerMessage(requestId, session.sessionId, token, user, rpcMessage)

      val packet = serializer.serialize(vpMsg)

      logger.trace("Calling RPC with packet:" + packet)

      handler.handle(packet, channel)

      channel.popMsg match {
        case Some(packet) =>
          logger.trace("Got RPC response packet:" + packet)
          val responseMsg = serializer.deserialize(packet)
          //responseMsg.body.asInstanceOf[ViewPort]
          null
        case None =>
          null
      }
    })
  }

  private def processDeleteCellAction(proxy: Any, method: Method): ViewPortDeleteCellAction = {
    ViewPortDeleteCellAction("", (key, column, vp, session) => {

      val requestId = RequestId.oneNew()
      val rpcMessage = ViewPortDeleteCellRpcCall(viewport.id, key, column)
      val vpMsg = JsonViewServerMessage(requestId, session.sessionId, token, user, rpcMessage)

      val packet = serializer.serialize(vpMsg)

      logger.trace("Calling RPC with packet:" + packet)

      handler.handle(packet, channel)

      channel.popMsg match {
        case Some(packet) =>
          logger.trace("Got RPC response packet:" + packet)
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

    val rpcMessage = RpcRequest(RequestContext("reqId", ClientSessionId("sessionId", "user"), new OutboundRowPublishQueue(), "token"), method.getName, argsForMessage)

    val msg = JsonViewServerMessage(requestId, session.sessionId, token, user, rpcMessage)

    val packet = serializer.serialize(msg)

    logger.trace("Calling RPC with packet:" + packet)

    handler.handle(packet, channel)

    channel.popMsg match {
      case Some(packet) =>
        logger.trace("Got RPC response packet:" + packet)
        val responseMsg = serializer.deserialize(packet)
        responseMsg.body.asInstanceOf[RpcFunctionResult]
      case None =>
        null
    }
  }

  override def invoke(proxy: Any, method: Method, args: Array[AnyRef]): AnyRef = {

    method.getName match {
      case "editCellAction" => processEditCellAction(proxy, method)
      case "editRowAction" => processEditRowAction(proxy, method)
      case "addRowAction" => processAddRowAction(proxy, method)
      case "deleteRowAction" => processDeleteRowAction(proxy, method)
      case "deleteCellAction" => processDeleteCellAction(proxy, method)
      case "onFormSubmit" => processFormSubmitAction(proxy, method)
      case _ => processRpcCall(proxy, method, args)
    }
  }
}
