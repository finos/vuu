package org.finos.vuu.test.rpc

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.net.json.JsonVsSerializer
import org.finos.vuu.net.{ClientSessionId, JsonViewServerMessage, ViewPortAddRowRpcCall, ViewPortDeleteCellRpcCall, ViewPortDeleteRowRpcCall, ViewPortEditCellRpcCall, ViewPortEditRowRpcCall, ViewPortEditSubmitFormRpcCall, ViewServerHandler}
import org.finos.vuu.test.impl.TestChannel
import org.finos.vuu.viewport.{ViewPort, ViewPortAddRowAction, ViewPortDeleteCellAction, ViewPortDeleteRowAction, ViewPortEditCellAction, ViewPortEditRowAction, ViewPortFormSubmitAction}

import java.lang.reflect.{InvocationHandler, Method}

class RpcDynamicProxy(viewport: ViewPort,
                      handler: ViewServerHandler, 
                      serializer: JsonVsSerializer,
                      user: VuuUser,
                      session: ClientSessionId,
                      channel: TestChannel) extends InvocationHandler with StrictLogging {

  private def processEditCellAction(proxy: Any, method: Method): ViewPortEditCellAction = {
    ViewPortEditCellAction("", (key, col, theValue, vp, session) => {

      val requestId = RequestId.oneNew()
      val rpcMessage = ViewPortEditCellRpcCall(viewport.id, key, col, theValue)
      val vpMsg = JsonViewServerMessage(requestId, session.sessionId, "", user.name, rpcMessage)

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
      val vpMsg = JsonViewServerMessage(requestId, session.sessionId, "", user.name, rpcMessage)

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
      val vpMsg = JsonViewServerMessage(requestId, session.sessionId, "", user.name, rpcMessage)

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
      val vpMsg = JsonViewServerMessage(requestId, session.sessionId, "", user.name, rpcMessage)

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
      val vpMsg = JsonViewServerMessage(requestId, session.sessionId, "", user.name, rpcMessage)

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
      val vpMsg = JsonViewServerMessage(requestId, session.sessionId, "", user.name, rpcMessage)

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

  override def invoke(proxy: Any, method: Method, args: Array[AnyRef]): AnyRef = {

    method.getName match {
      case "editCellAction" => processEditCellAction(proxy, method)
      case "editRowAction" => processEditRowAction(proxy, method)
      case "addRowAction" => processAddRowAction(proxy, method)
      case "deleteRowAction" => processDeleteRowAction(proxy, method)
      case "deleteCellAction" => processDeleteCellAction(proxy, method)
      case "onFormSubmit" => processFormSubmitAction(proxy, method)
      case _ => throw new IllegalArgumentException(s"Unsupported rpc call $method. If this is a RpcRequest, you can retrieve it from viewport.viewPortDef.service")
    }
  }
}
