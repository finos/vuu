package org.finos.vuu.net.auth

trait VuuUser {

  def name: String
  def authorizations: Set[String]
  def addAuthorization(authorization: String): VuuUser
  def withAuthorizations(authorizations: Set[String]): VuuUser
}

object VuuUser {

  def apply(username: String) = VuuUserImpl(username, Set.empty)

  def apply(username: String, authorizations: Set[String]) = VuuUserImpl(username, authorizations)

}

private case class VuuUserImpl(name: String,
                               authorizations: Set[String]) extends VuuUser {

  override def addAuthorization(authorization: String): VuuUser = {
    this.copy(authorizations = authorizations + authorization)
  }

  override def withAuthorizations(authorizations: Set[String]): VuuUser = {
    this.copy(authorizations = authorizations)
  }
}
