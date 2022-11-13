package org.finos.vuu.net

import java.util.concurrent.{ConcurrentHashMap, ConcurrentMap}

trait LoginTokenValidator {
  def login(msg: LoginRequest): Either[ViewServerMessage, String]
}

class AlwaysHappyLoginValidator extends LoginTokenValidator {

  override def login(msg: LoginRequest): Either[ViewServerMessage, String] = {
    Left(JsonViewServerMessage("", "", msg.token, msg.user, LoginSuccess(msg.token)))
  }
}

class ServerUserPrincipal(val token: String, val userName: String){
}

class LoggedInTokenValidator extends LoginTokenValidator {

  private val tokenUserMap: ConcurrentMap[String, ServerUserPrincipal] = new ConcurrentHashMap[String, ServerUserPrincipal]()

  def register(token: String, userPrincipal: ServerUserPrincipal): Unit = {
    tokenUserMap.put(token, userPrincipal)
  }

  override def login(msg: LoginRequest): Either[ViewServerMessage, String] = {
    if(tokenUserMap.containsKey(msg.token)){
      Left(JsonViewServerMessage("", "", msg.token, msg.user, LoginSuccess(msg.token)))
    }else{
      Right("User token not found")
    }
  }
}
