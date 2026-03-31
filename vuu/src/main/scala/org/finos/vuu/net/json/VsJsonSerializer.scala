package org.finos.vuu.net.json

import org.finos.vuu.net.{JsonViewServerMessage, ViewServerMessage}

trait VsJsonSerializer {
  def serialize(message: ViewServerMessage): String

  def deserialize(message: String): ViewServerMessage
}

object VsJsonSerializer  {

  def apply(): VsJsonSerializer = VsJsonSerializerImpl
  
}

object VsJsonSerializerImpl extends VsJsonSerializer {

  private val jsonMapper = JsonMapperFactory.get()
  
  override def serialize(message: ViewServerMessage): String = jsonMapper.writeValueAsString(message)

  override def deserialize(message: String): ViewServerMessage = jsonMapper.readValue(message, classOf[JsonViewServerMessage])
}



