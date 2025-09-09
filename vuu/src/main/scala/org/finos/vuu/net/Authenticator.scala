package org.finos.vuu.net

trait Authenticator {

  def authenticator(user: String, password: String): Option[String]

}
