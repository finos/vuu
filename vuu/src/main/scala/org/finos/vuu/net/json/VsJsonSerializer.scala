package org.finos.vuu.net.json

import org.finos.vuu.net.{JsonViewServerMessage, ViewServerMessage}
import tools.jackson.databind.json.JsonMapper

trait VsJsonSerializer {
  def serialize(message: ViewServerMessage): String

  def deserialize(message: String): ViewServerMessage
}

object VsJsonSerializer  {

  private val jsonMapper = JsonMapperFactory.get()
  
  def apply(): VsJsonSerializer = VsJsonSerializerImpl(jsonMapper)
  
}

case class VsJsonSerializerImpl(jsonMapper: JsonMapper) extends VsJsonSerializer {
  
  override def serialize(message: ViewServerMessage): String = jsonMapper.writeValueAsString(message)

  override def deserialize(message: String): ViewServerMessage = jsonMapper.readValue(message, classOf[JsonViewServerMessage])
}



