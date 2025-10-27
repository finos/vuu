package org.finos.vuu.net.json

import com.fasterxml.jackson.databind.ObjectMapper
import org.finos.toolbox.json.JsonUtil
import org.finos.vuu.net.{JsonViewServerMessage, ViewServerMessage}

trait JsonVsSerializer {
  def serialize(message: ViewServerMessage): String

  def deserialize(message: String): ViewServerMessage
}

object JsonVsSerializer  {

  def apply(): JsonVsSerializer = {
    apply(JsonUtil.createMapper())
  }

  def apply(objectMapper: ObjectMapper): JsonVsSerializer = {
    JsonVsSerializerImpl(objectMapper)
  }

}

case class JsonVsSerializerImpl(objectMapper: ObjectMapper) extends JsonVsSerializer {

  override def serialize(message: ViewServerMessage): String = objectMapper.writeValueAsString(message)

  override def deserialize(message: String): ViewServerMessage = objectMapper.readValue(message, classOf[JsonViewServerMessage])
}



