package org.finos.vuu.net.auth

import org.finos.toolbox.json.JsonUtil
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.net.LoginRequest
import org.finos.vuu.util.HMACUtils

import java.security.SecureRandom
import java.time.Instant

trait LoginTokenService {

  def getToken(user: VuuUser): String
  def login(msg: LoginRequest, vuuServerId: String): Either[String, VuuUser]

}

object LoginTokenService {

  def apply(vuuUser: VuuUser): LoginTokenService = AlwaysHappyLoginTokenService(vuuUser)

  def apply(): LoginTokenService = {
    val bytes = Array[Byte](64)
    SecureRandom().nextBytes(bytes)
    apply(bytes)
  }

  def apply(sharedSecret: Array[Byte]): LoginTokenService = LoginTokenServiceImpl(sharedSecret)

}

case class AlwaysHappyLoginTokenService(vuuUser: VuuUser) extends LoginTokenService {

  override def getToken(user: VuuUser): String = "AlwaysHappy"

  override def login(msg: LoginRequest, vuuServerId: String): Either[String, VuuUser] = {
    Right(vuuUser)
  }

}

case class LoginTokenServiceImpl(secret: Array[Byte]) extends LoginTokenService {

  override def getToken(user: VuuUser): String = {
    val payload = JsonUtil.toRawJson(user)
    HMACUtils.sign(payload, secret)
  }

  override def login(msg: LoginRequest, vuuServerId: String): Either[String, VuuUser] = {
    HMACUtils.verifyAndRemoveSignature(msg.token, secret) match {
      case Right(value) =>
        val vuuUser: VuuUser = JsonUtil.fromJson(value)
        if (Instant.now().isBefore(vuuUser.expiry)) {
          Right(vuuUser)
        } else {
          Left("Token has expired")
        }
      case Left(value) => Left("Invalid token")
    }
  }

}
