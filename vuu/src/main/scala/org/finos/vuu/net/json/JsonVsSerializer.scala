package org.finos.vuu.net.json

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import org.finos.vuu.net.{JsonViewServerMessage, ViewServerMessage}

trait JsonVsSerializer {
  def serialize(message: ViewServerMessage): String

  def deserialize(message: String): ViewServerMessage
}

object JsonVsSerializer  {

  def apply(): JsonVsSerializer = {
    val mapper = ObjectMapper()
    mapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES, true)
    mapper.configure(JsonParser.Feature.ALLOW_SINGLE_QUOTES, true)
    mapper.registerModule(DefaultScalaModule)
    apply(mapper)
  }

  def apply(objectMapper: ObjectMapper): JsonVsSerializer = {
    JsonVsSerializerImpl(objectMapper)
  }
    
}

case class JsonVsSerializerImpl(objectMapper: ObjectMapper) extends JsonVsSerializer {

  override def serialize(message: ViewServerMessage): String = objectMapper.writeValueAsString(message)

  override def deserialize(message: String): ViewServerMessage = objectMapper.readValue(message, classOf[JsonViewServerMessage])
}



