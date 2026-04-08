package org.finos.vuu.net.rest

import org.finos.vuu.net.json.JsonSerializer
import tools.jackson.module.scala.JavaTypeable

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

  def apply[T : JavaTypeable](): EntityEncoder[T] = {
    new JacksonEntityEncoderImpl[T](JsonSerializer())
  }
}

private case class JacksonEntityEncoderImpl[T](jsonSerializer: JsonSerializer[T]) extends EntityEncoder[T] {

  override def encode(value: T): Array[Byte] = {
    if (value == null) {
      Array.emptyByteArray
    } else {
      jsonSerializer.serializeAsBytes(value)
    }
  }

  override def decode(is: InputStream): T = {
    try {
      jsonSerializer.deserialize(is)
    } finally {
      if (is != null) is.close()
    }
  }

  override def contentType: String = "application/json"
}
