package org.finos.vuu.net

import org.finos.vuu.core.auths.VuuUser

import java.util.concurrent.{ConcurrentHashMap, ConcurrentMap}

trait LoginTokenValidator {
  def login(msg: LoginRequest, vuuServerId: String): ViewServerMessage
}

class AlwaysHappyLoginValidator extends LoginTokenValidator {

  override def login(msg: LoginRequest, vuuServerId: String): ViewServerMessage = {
    JsonViewServerMessage("", "", msg.token, msg.user, LoginSuccess(msg.token, vuuServerId))
  }
}

class LoggedInTokenValidator extends LoginTokenValidator {

  private val tokenUserMap: ConcurrentMap[String, VuuUser] = new ConcurrentHashMap[String, VuuUser]()

  def register(token: String, userPrincipal: VuuUser): Unit = {
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
