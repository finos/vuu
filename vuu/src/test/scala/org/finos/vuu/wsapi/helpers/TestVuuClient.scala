package org.finos.vuu.wsapi.helpers

import org.finos.vuu.client.messages.{RequestId, TokenId}
import org.finos.vuu.net._
import org.scalatest.concurrent.TimeLimits.failAfter
import org.scalatest.time.Span
import org.scalatest.time.SpanSugar._

import java.util.concurrent.ConcurrentHashMap
import scala.language.postfixOps
import scala.reflect.ClassTag

class TestVuuClient(vsClient: ViewServerClient) {

  type SessionId = String
  type Token = String

  val timeout: Span = 30 seconds

  def send(sessionId: String, token: String, body: MessageBody): Unit = {
    vsClient.send(createViewServerMessage(sessionId, token, body))
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
      .map(msg => return Some(msg))

    val msg = vsClient.awaitMsg
    if (msg != null)
      if (msg.requestId == requestId)
        Some(msg)
      else {
        responsesMap.put(requestId, msg)
        awaitForResponse(requestId)
      }
    else
      None
  }

  def createAuthToken(): Token = TokenId.oneNew()

  def login(token: String, user: String): Option[String] = {
    send("not used", "not used", LoginRequest(token, user))

    //capture messages rather than dismissing, - how to cap size
    // need to match on request id to ensure correct response?
    awaitForMsg[LoginSuccess]
      .map(x => x.sessionId)
    //todo handle no response
    //todo what to do if LoginFailure
    // why does these response return token that was passed in the request? Does UI use this or match based on message request id?
  }

  private def isExpectedBodyType[T <: AnyRef](t: ClassTag[T], msg: ViewServerMessage) = {
    val expectedBodyType: Class[T] = t.runtimeClass.asInstanceOf[Class[T]]
    expectedBodyType.isAssignableFrom(msg.body.getClass)
  }

  private def lookupFromReceivedResponses(requestId: String): Option[ViewServerMessage] = {
    Option(responsesMap.get(requestId))
  }

  private def createViewServerMessage(sessionId: String, token: String, body: MessageBody): ViewServerMessage = {
    JsonViewServerMessage(RequestId.oneNew(),
      sessionId,
      token,
      "testUser",
      body,
      "DoesntReallyMatter")
  }
}
