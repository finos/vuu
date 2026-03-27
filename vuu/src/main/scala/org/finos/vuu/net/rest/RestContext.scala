package org.finos.vuu.net.rest

import scala.util.Try

trait RestContext {
  def method: String

  def uri: String

  def remoteAddress: String

  def requestHeaders: Map[String, String]

  def pathParams: Map[String, String]

  def queryParams: Map[String, Seq[String]]

  def cookies: Map[String, String]

  def bodyInputStream: java.io.InputStream

  def bodyAs[T](entityEncoder: EntityEncoder[T]): Try[T]

  def formParams: Map[String, Seq[String]]

  def attributes: AttributeMap

  def respond(status: Int): Unit = respond(status, null, EmptyEncoder)

  def respond[T](
                  status: Int,
                  body: T = null,
                  entityEncoder: EntityEncoder[T],
                  headers: Map[String, String] = Map.empty,
                  cookies: Seq[Cookie] = Seq.empty
                ): Unit

  def redirect(location: String, status: Int = 302): Unit
}

case class AttributeKey[T](name: String)

trait AttributeMap {
  def put[T](key: AttributeKey[T], value: T): Unit

  def get[T](key: AttributeKey[T]): Option[T]
}

case class Cookie(name: String,
                  value: String,
                  maxAge: Option[Int] = None,
                  path: String = "/",
                  secure: Boolean = false,
                  httpOnly: Boolean = true)