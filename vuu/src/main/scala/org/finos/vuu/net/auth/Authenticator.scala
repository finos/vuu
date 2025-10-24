package org.finos.vuu.net.auth

import org.finos.vuu.core.auths.VuuUser

trait Authenticator[T] {

  def tokenService: LoginTokenService
  def authenticate(input: T): Either[String, String]

}

object Authenticator {

  def apply(tokenService: LoginTokenService): Authenticator[String] = {
    apply(tokenService, userId => Right(VuuUser(userId)))
  }

  def apply[T <: AnyRef](tokenService: LoginTokenService,
                         authFunction: Function[T, Either[String, VuuUser]]): AuthenticatorImpl[T] = {
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


