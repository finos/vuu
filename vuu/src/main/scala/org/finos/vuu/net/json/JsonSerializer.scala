package org.finos.vuu.net.json

import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.scala.JavaTypeable

trait JsonSerializer[T] {

  def serialize(message: T): String

  def deserialize(message: String): T

}

object JsonSerializer {

  def apply[T : JavaTypeable]: JsonSerializer[T] = {
    JacksonJsonSerializer[T](JsonMapperFactory.build)
  }

}

private case class JacksonJsonSerializer[T](mapper: JsonMapper)(implicit typeable: JavaTypeable[T])
  extends JsonSerializer[T] {

  override def serialize(message: T): String = {
    mapper.writeValueAsString(message)
  }

  override def deserialize(message: String): T = {
    mapper.readValue(message, typeable.asJavaType(mapper.getTypeFactory))
  }
}
