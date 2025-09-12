package org.finos.vuu.net.auth

import org.finos.vuu.client.messages.TokenId
import org.finos.vuu.net.Authenticator

class AlwaysHappyAuthenticator extends Authenticator {

  override def authenticator(user: String, password: String): Option[String] = {
    val token = TokenId.oneNew()
    Some(token)
  }
}
