package org.finos.vuu.core.auths

import java.time.Instant

trait VuuUser {

  def name: String
  def expiry: Instant
  def authorizations: Set[String]
  def addAuthorization(authorization: String): VuuUser
  def withAuthorizations(authorizations: Set[String]): VuuUser
  def withExpiry(expiry: Instant): VuuUser
}

object VuuUser {

  def apply(username: String): VuuUserImpl = apply(username, Instant.MAX)

  def apply(username: String, expiry: Instant): VuuUserImpl = apply(username, expiry, Set.empty)
  
  def apply(username: String, authorizations: Set[String]): VuuUserImpl = apply(username, Instant.MAX, authorizations)

  def apply(username: String, expiry: Instant, authorizations: Set[String]): VuuUserImpl = VuuUserImpl(username, expiry, authorizations)
  
}

private case class VuuUserImpl(name: String,
                               expiry: Instant,
                               authorizations: Set[String]) extends VuuUser {

  override def addAuthorization(authorization: String): VuuUser = {
    this.copy(authorizations = authorizations + authorization)
  }

  override def withAuthorizations(authorizations: Set[String]): VuuUser = {
    this.copy(authorizations = authorizations)
  }

  override def withExpiry(expiry: Instant): VuuUser = {
    this.copy(expiry = expiry)
  }
  
}
