package org.finos.vuu.wsapi.helpers

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.client.messages.{RequestId}
import org.finos.vuu.net.*
import org.scalatest.concurrent.TimeLimits.failAfter
import org.scalatest.concurrent.{Signaler, ThreadSignaler}
import org.scalatest.time.Span
import org.scalatest.time.SpanSugar.*

import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import scala.annotation.tailrec
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


  implicit val signaler: Signaler = ThreadSignaler

  def awaitForMsg[T <: AnyRef](implicit t: ClassTag[T]): Option[ViewServerMessage] = {
    failAfter(timeout) {
      getNextMessageUntilBodyIsExpectedType()
    }
  }

  @tailrec
  private def getNextMessageUntilBodyIsExpectedType[T <: AnyRef]()(implicit t: ClassTag[T]): Option[ViewServerMessage] = {
    val msg = vsClient.awaitMsg
    if (msg != null) { //null indicate error or timeout
      if (isExpectedBodyType(t, msg)) {
        Some(msg)
      } else {
        logger.whenDebugEnabled(
          logger.debug(s"Received ${msg.body.getClass} but was expecting ${t.runtimeClass}. Dismissing message and waiting for next one.")
        )
        getNextMessageUntilBodyIsExpectedType()
      }
    }
    else {
      logger.debug(s"Did not receive any message in response. Try waiting again.")
      getNextMessageUntilBodyIsExpectedType()
    }
  }

  val responsesMap: ConcurrentHashMap[String, ViewServerMessage] = new ConcurrentHashMap

  def awaitForResponse(requestId: String): Option[ViewServerMessage] = {
    failAfter(timeout) {
      getNextMessageUntilResponseForRequestId(requestId)
    }
  }

  @tailrec
  private def getNextMessageUntilResponseForRequestId(requestId: String): Option[ViewServerMessage] = {
    lookupFromReceivedResponses(requestId)
      .map(msg => {
        logger.debug(s"Found response for $requestId in cache")
        Some(msg)
      })

    val msg = vsClient.awaitMsg
    if (msg != null)
      if (msg.requestId == requestId) {
        logger.debug(s"Received response for $requestId")
        Some(msg)
      } else {
        responsesMap.put(msg.requestId, msg)
        logger.debug(s"Added response for $requestId in cache")
        getNextMessageUntilResponseForRequestId(requestId)
      }
    else {
      logger.error(s"Failed or timed out while waiting for response for $requestId")
      getNextMessageUntilResponseForRequestId(requestId)
    }
  }

  def createAuthToken(): Token = UUID.randomUUID().toString

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
