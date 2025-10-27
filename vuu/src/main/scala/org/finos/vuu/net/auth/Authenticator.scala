package org.finos.vuu.net.auth

import org.finos.vuu.core.auths.VuuUser

trait Authenticator[T] {

  def authenticate(input: T): Either[String, String]

}

object Authenticator {

  /**
   * @param tokenService , the service being used by this instance of Vuu
   * @param authFunction , the function to call to determine if authentication should pass or fail.
   * @return An authenticator that calls an authFunction and returns a valid token if it succeeds.
   */
  def apply[T <: AnyRef](tokenService: LoginTokenService,
                         authFunction: Function[T, Either[String, VuuUser]]): Authenticator[T] = {
    AuthenticatorImpl(tokenService, authFunction)
  }

}

case class AuthenticatorImpl[T <: AnyRef](tokenService: LoginTokenService,
                                          authFunction: Function[T, Either[String, VuuUser]]) extends Authenticator[T] {

  override def authenticate(input: T): Either[String, String] = {
    authFunction.apply(input) match {
      case Right(value) => Right(tokenService.getToken(value))
      case Left(value) => Left(s"Authentication failed: $value")
    }
  }
  
}


