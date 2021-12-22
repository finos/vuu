package io.venuu.vuu.net.auth

import io.venuu.vuu.client.messages.TokenId
import io.venuu.vuu.net.{AuthenticateSuccess, Authenticator, JsonViewServerMessage, ViewServerMessage}

class AlwaysHappyAuthenticator extends Authenticator {

  /**
   * Authenticator interface, either returns a token (on success) or Auth failure on failure
   */
  override def authenticate(user: String, password: String): Option[ViewServerMessage] = {
    val token = TokenId.oneNew()
    Some(JsonViewServerMessage("", "", token, "user", AuthenticateSuccess(token)))
  }
}
