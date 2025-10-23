package org.finos.vuu.net.auth

import org.finos.vuu.client.messages.TokenId
import org.finos.vuu.net.Authenticator

class AlwaysHappyAuthenticator extends Authenticator {

  override def authenticate(credentials: Map[String, Object]): Option[String] = {
    val token = TokenId.oneNew()
    Some(token)
  }
}
