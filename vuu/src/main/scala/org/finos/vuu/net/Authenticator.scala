package org.finos.vuu.net

trait Authenticator {

  def authenticator(user: String, password: String): Option[String]

  /**
   * Authenticator interface, either returns a token (on success) or Auth failure on failure
   */
  def authenticate(user: String, password: String): Option[ViewServerMessage]
}
