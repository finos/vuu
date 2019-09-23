package io.venuu.vuu.net

/**
 * Created by chris on 03/11/2015.
 */
trait Authenticator {
  /**
   * Authenticator interface, either returns a token (on success) or Auth failure on failure
   */
  def authenticate(user: String, password: String): Option[ViewServerMessage]
}
