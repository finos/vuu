package org.finos.vuu.core.auths

import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}

import java.time.Instant

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes(Array(
  new JsonSubTypes.Type(value = classOf[VuuUserImpl], name = "VUU_USER")
))
trait VuuUser {

  def name: String
  def expiry: Instant
  def authorizations: Set[String]
  def withName(name: String): VuuUser
  def withAuthorizations(authorizations: Set[String]): VuuUser
  def withExpiry(expiry: Instant): VuuUser
}

object VuuUser {

  def apply(username: String): VuuUser = apply(username, Instant.MAX)

  def apply(username: String, expiry: Instant): VuuUser = apply(username, expiry, Set.empty)
  
  def apply(username: String, authorizations: Set[String]): VuuUser = apply(username, Instant.MAX, authorizations)

  def apply(username: String, expiry: Instant, authorizations: Set[String]): VuuUser = VuuUserImpl(username, expiry, authorizations)
  
}

case class VuuUserImpl(name: String,
                       expiry: Instant,
                       authorizations: Set[String]) extends VuuUser {

  override def withAuthorizations(authorizations: Set[String]): VuuUser = this.copy(authorizations = authorizations)

  override def withExpiry(expiry: Instant): VuuUser = this.copy(expiry = expiry)

  override def withName(name: String): VuuUser = this.copy(name = name)

}
