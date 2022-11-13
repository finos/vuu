package org.finos.vuu.net.auth

import org.finos.vuu.client.messages.TokenId
import org.finos.vuu.net.{AuthenticateSuccess, Authenticator, JsonViewServerMessage, ViewServerMessage}

class AlwaysHappyAuthenticator extends Authenticator {

  /**
   * Authenticator interface, either returns a token (on success) or Auth failure on failure
   */
  override def authenticate(user: String, password: String): Option[ViewServerMessage] = {
    val token = TokenId.oneNew()
    Some(JsonViewServerMessage("", "", token, "user", AuthenticateSuccess(token)))
  }

  override def authenticator(user: String, password: String): Option[String] = {
    val token = TokenId.oneNew()
    Some(token)
  }
}
