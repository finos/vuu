/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 16/11/2015.

  */
package io.venuu.vuu.net.auth

import java.util.UUID

import io.venuu.vuu.net.{AuthenticateSuccess, Authenticator, JsonViewServerMessage, ViewServerMessage}

class AlwaysHappyAuthenticator extends Authenticator {

  /**
    * Authenticator interface, either returns a token (on success) or Auth failure on failure
    */
  override def authenticate(user: String, password: String): Option[ViewServerMessage] = {
    val token = UUID.randomUUID().toString
    Some(JsonViewServerMessage("", "", token, "user", AuthenticateSuccess(token)))
  }
}
