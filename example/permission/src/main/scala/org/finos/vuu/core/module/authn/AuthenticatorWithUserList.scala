package org.finos.vuu.core.module.authn

import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.net.auth.{Authenticator, LoginTokenService}

class AuthenticatorWithUserList(val loginTokenService: LoginTokenService, val users: Option[java.util.Set[String]]) extends Authenticator[String] {

  private final val inner: Authenticator[String] = Authenticator.apply(loginTokenService, f => Right(VuuUser(f)))

  override def authenticate(input: String): Either[String, String] = {
    if (users.nonEmpty) users.get.add(input)
    inner.authenticate(input)
  }
}
