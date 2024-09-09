package org.finos.vuu.wsapi.helpers

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.client.messages.{RequestId, TokenId}
import org.finos.vuu.net._
import org.scalatest.concurrent.TimeLimits.failAfter
import org.scalatest.time.Span
import org.scalatest.time.SpanSugar._

import java.util.concurrent.ConcurrentHashMap
import scala.language.postfixOps
import scala.reflect.ClassTag

class TestVuuClient(vsClient: ViewServerClient) extends StrictLogging {

  type SessionId = String
  type Token = String

  val timeout: Span = 30 seconds

  def send(sessionId: String, token: String, body: MessageBody): String = {
    val msg = createViewServerMessage(sessionId, token, body)
    vsClient.send(msg)
    msg.requestId
  }

  //todo fold this in to WebSocketViewServerClient?
  //is intention that this can be used for non ws client?
  def awaitForMsgWithBody[T <: AnyRef](implicit t: ClassTag[T]): Option[T] =
    awaitForMsg.map(msg => msg.body.asInstanceOf[T])

  def awaitForMsg[T <: AnyRef](implicit t: ClassTag[T]): Option[ViewServerMessage] = {
    failAfter(timeout){
      val msg = vsClient.awaitMsg
      if (msg != null) { //null indicate error or timeout
        if (isExpectedBodyType(t, msg))
          Some(msg)
        else
          awaitForMsg
      }
      else
        None
    }
  }

  val responsesMap: ConcurrentHashMap[String, ViewServerMessage] = new ConcurrentHashMap

  def awaitForResponse(requestId: String): Option[ViewServerMessage] = {

    lookupFromReceivedResponses(requestId)
      .map(msg => {
        logger.info(s"Found response for $requestId in cache")
        return Some(msg)
      })

    val msg = vsClient.awaitMsg
    if (msg != null)
      if (msg.requestId == requestId) {
        logger.info(s"Received response for $requestId")
        Some(msg)
      } else {
        responsesMap.put(msg.requestId, msg)
        logger.info(s"Added response for $requestId in cache")
        awaitForResponse(requestId)
      }
    else {
      logger.error(s"Failed or timed out while waiting for response for $requestId")
      None
    }
  }

  def createAuthToken(): Token = TokenId.oneNew()

  def login(token: String, user: String): Option[String] = {
    send("not used", "not used", LoginRequest(token, user))
    awaitForMsg[LoginSuccess]
      .map(x => x.sessionId)
  }

  private def isExpectedBodyType[T <: AnyRef](t: ClassTag[T], msg: ViewServerMessage) = {
    val expectedBodyType: Class[T] = t.runtimeClass.asInstanceOf[Class[T]]
    expectedBodyType.isAssignableFrom(msg.body.getClass)
  }

  private def lookupFromReceivedResponses(requestId: String): Option[ViewServerMessage] =
    Option(responsesMap.remove(requestId))


  private def createViewServerMessage(sessionId: String, token: String, body: MessageBody): ViewServerMessage = {
    JsonViewServerMessage(RequestId.oneNew(),
      sessionId,
      token,
      "testUser",
      body,
      "DoesntReallyMatter")
  }
}
