package io.venuu.vuu.net

/**
 * Created by chris on 12/11/2015.
 */
trait LoginTokenValidator {
  def login(msg: LoginRequest): Either[ViewServerMessage, String]
}

class AlwaysHappyLoginValidator extends LoginTokenValidator {

  override def login(msg: LoginRequest): Either[ViewServerMessage, String] = {
    Left(JsonViewServerMessage("", "", msg.token, msg.user, LoginSuccess(msg.token)))
  }
}
