package org.finos.vuu.net.json

import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.scala.JavaTypeable

import java.io.InputStream

trait JsonSerializer[T : JavaTypeable] {

  def serialize(message: T): String

  def serializeAsBytes(message: T): Array[Byte]

  def deserialize(message: String): T

  def deserialize(inputStream: InputStream): T

}

object JsonSerializer {

  def apply[T : JavaTypeable]: JsonSerializer[T] = {
    JacksonJsonSerializer[T](JsonMapperFactory.build)
  }

}

private case class JacksonJsonSerializer[T](mapper: JsonMapper)
                                           (implicit typeable: JavaTypeable[T]) extends JsonSerializer[T] {

  override def serialize(message: T): String = {
    mapper.writeValueAsString(message)
  }

  override def serializeAsBytes(message: T): Array[Byte] = {
    mapper.writeValueAsBytes(message)
  }

  override def deserialize(message: String): T = {
    mapper.readValue(message, typeable.asJavaType(mapper.getTypeFactory))
  }

  override def deserialize(inputStream: InputStream): T = {
    mapper.readValue(inputStream, typeable.asJavaType(mapper.getTypeFactory))
  }
}
