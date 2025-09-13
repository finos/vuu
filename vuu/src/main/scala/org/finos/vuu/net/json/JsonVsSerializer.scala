package org.finos.vuu.net.json

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import org.finos.vuu.net.{JsonViewServerMessage, MessageBody, ViewServerMessage}

trait Serializer[R, SERTYPE] {
  def serialize(message: ViewServerMessage): R

  def deserialize(message: R): ViewServerMessage
}

object JsonVsSerializer extends Serializer[String, MessageBody] {

  def getMapper: ObjectMapper = {
    val mapper = new ObjectMapper()
    mapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES, true)
    mapper.configure(JsonParser.Feature.ALLOW_SINGLE_QUOTES, true)
    mapper.registerModule(DefaultScalaModule)
    mapper
  }

  def deserialize(s: String): JsonViewServerMessage = {
    val mapper = getMapper
    mapper.readValue(s, classOf[JsonViewServerMessage])
  }


  def serialize(message: ViewServerMessage): String = {
    val mapper = getMapper
    mapper.writeValueAsString(message)
  }

}




