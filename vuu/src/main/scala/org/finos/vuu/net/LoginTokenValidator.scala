package org.finos.vuu.net

import java.util.concurrent.{ConcurrentHashMap, ConcurrentMap}

trait LoginTokenValidator {
  def login(msg: LoginRequest, vuuServerId: String): ViewServerMessage
}

class AlwaysHappyLoginValidator extends LoginTokenValidator {

  override def login(msg: LoginRequest, vuuServerId: String): ViewServerMessage = {
    JsonViewServerMessage("", "", msg.token, msg.user, LoginSuccess(msg.token, vuuServerId))
  }
}

class ServerUserPrincipal(val token: String, val userName: String) {
}

class LoggedInTokenValidator extends LoginTokenValidator {

  private val tokenUserMap: ConcurrentMap[String, ServerUserPrincipal] = new ConcurrentHashMap[String, ServerUserPrincipal]()

  def register(token: String, userPrincipal: ServerUserPrincipal): Unit = {
    tokenUserMap.put(token, userPrincipal)
  }

  override def login(msg: LoginRequest, vuuServerId: String): ViewServerMessage = {
    if (tokenUserMap.containsKey(msg.token)) {
      JsonViewServerMessage("", "", msg.token, msg.user, LoginSuccess(msg.token, vuuServerId))
    } else {
      JsonViewServerMessage("", "", msg.token, msg.user, LoginFailure(msg.token, "User token not found"))
    }
  }
}
