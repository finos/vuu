package org.finos.vuu.core.module.authn

import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.net.auth.{Authenticator, LoginTokenService}

class AuthenticatorWithUserList(val loginTokenService: LoginTokenService, val users: Option[Map[String,String]]) extends Authenticator[(String,String)] {

  private final val inner: Authenticator[(String,String)] = Authenticator.apply(loginTokenService, f => authenticateFromUserList(f))

  override def authenticate(input: (String,String)): Either[String, String] = inner.authenticate(input)

  private def authenticateFromUserList(input: (String,String)): Either[String, VuuUser] = {
    if (users.isEmpty) { //Allow all users
      Right(VuuUser(input._1))
    } else {
      //This is clearly not for production as passwords are plain text. But you get the gist.
      if (users.get.contains(input._1) && users.get(input._1) == input._2) {
        Right(VuuUser(input._1))
      } else {
        Left("Invalid username/password")
      }
    }
  }

}
