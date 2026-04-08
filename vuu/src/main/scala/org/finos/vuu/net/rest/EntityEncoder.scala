package org.finos.vuu.net.rest

import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.scala.{DefaultScalaModule, JavaTypeable}

import java.io.InputStream
import java.nio.charset.StandardCharsets
import scala.io.Source

trait EntityEncoder[T] {

  def encode(value: T): Array[Byte]

  def decode(is: java.io.InputStream): T

  def contentType: String

}

object StringEncoder extends EntityEncoder[String] {

  def encode(value: String): Array[Byte] = {
    if (value == null) Array.emptyByteArray
    else value.getBytes(StandardCharsets.UTF_8)
  }

  override def decode(is: InputStream): String = {
    try {
      Source.fromInputStream(is)(StandardCharsets.UTF_8).mkString
    } finally {
      if (is != null) is.close()
    }
  }

  override def contentType: String = "text/plain"
}

object EmptyEncoder extends EntityEncoder[Null] {

  override def encode(value: Null): Array[Byte] = Array.emptyByteArray

  override def decode(is: InputStream): Null = null

  override def contentType: String = "text/plain"
}

object JsonEntityEncoder {

  private val jsonMapper = JsonMapper.builder()
    .addModule(DefaultScalaModule())
    .build()

  def apply[T: JavaTypeable](): EntityEncoder[T] =
    new JsonEntityEncoderImpl[T](jsonMapper)
}

private case class JsonEntityEncoderImpl[T](mapper: JsonMapper)
                                           (implicit typeable: JavaTypeable[T]) extends EntityEncoder[T] {

  override def encode(value: T): Array[Byte] = {
    if (value == null) {
      Array.emptyByteArray
    } else {
      mapper.writeValueAsBytes(value)
    }
  }

  override def decode(is: InputStream): T = {
    try {
      mapper.readValue(is, typeable.asJavaType(mapper.getTypeFactory))
    } finally {
      if (is != null) is.close()
    }
  }

  override def contentType: String = "application/json"
}
