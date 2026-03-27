package org.finos.vuu.core.module.authn

import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.net.auth.{Authenticator, LoginTokenService}

class AuthenticatorWithUserList(val loginTokenService: LoginTokenService, val users: Option[Map[String,String]]) extends Authenticator[LoginRequest] {

  private final val inner: Authenticator[LoginRequest] = Authenticator.apply(loginTokenService, f => authenticateFromUserList(f))

  override def authenticate(input: LoginRequest): Either[String, String] = inner.authenticate(input)

  private def authenticateFromUserList(input: LoginRequest): Either[String, VuuUser] = {
    if (users.isEmpty) { //Allow all users
      Right(VuuUser(input.username))
    } else {
      //This is clearly not for production as passwords are plain text. But you get the gist.
      if (users.get.contains(input.username) && users.get(input.username) == input.password) {
        Right(VuuUser(input.username))
      } else {
        Left("Invalid username/password")
      }
    }
  }

}
