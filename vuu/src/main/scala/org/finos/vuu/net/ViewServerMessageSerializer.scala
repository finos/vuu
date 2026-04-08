package org.finos.vuu.net

import org.finos.vuu.net.json.JsonMapperFactory

object ViewServerMessageSerializer {
  
  private val jsonMapper = JsonMapperFactory.build

  def serialize(message: ViewServerMessage): String = {
    jsonMapper.writeValueAsString(message)
  }

  def deserialize(message: String): ViewServerMessage = {
    jsonMapper.readValue(message, classOf[JsonViewServerMessage])
  }
  
}