package org.finos.vuu.net

trait Authenticator {

  def authenticate(credentials: Map[String, Object]): Option[String]

}
