package org.finos.vuu.net.rest

trait RestContext {
  def method: String
  def uri: String
  def remoteAddress: String

  def requestHeaders: Map[String, String]
  def pathParams: Map[String, String]
  def queryParams: Map[String, Seq[String]]
  def cookies: Map[String, String]

  def bodyInputStream: java.io.InputStream
  def bodyAs[T](implicit decoder: EntityDecoder[T]): Option[T]
  def formParams: Map[String, Seq[String]] // For URL-encoded forms

  def attributes: AttributeMap

  // --- Response Logic ---
  def respond[T](
                  status: Int,
                  body: T = null,
                  headers: Map[String, String] = Map.empty,
                  cookies: Seq[Cookie] = Seq.empty
                )(implicit encoder: EntityEncoder[T] = EmptyEncoder): Unit

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

trait EntityDecoder[T] {
  def decode(is: java.io.InputStream): T
}

trait EntityEncoder[T] {
  def encode(value: T): Array[Byte]
  def contentType: String
}

implicit object EmptyEncoder extends EntityEncoder[Null] {
  def encode(value: Null): Array[Byte] = Array.emptyByteArray
  def contentType: String = "text/plain"
}