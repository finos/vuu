package org.finos.vuu.net.json

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.net.{JsonViewServerMessage, MessageBody, ViewServerMessage}

trait Serializer[R, SERTYPE] {
  def serialize(message: ViewServerMessage): R

  def deserialize(message: R): ViewServerMessage
}

object JsonVsSerializer extends Serializer[String, MessageBody] with StrictLogging {

  def getMapper = {
    val mapper = new ObjectMapper()
    mapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES, true)
    mapper.configure(JsonParser.Feature.ALLOW_SINGLE_QUOTES, true)
    //mapper.addMixIn(classOf[MessageBody], classOf[CoreJsonSerializationMixin])
    mapper.registerModule(DefaultScalaModule)
    mapper
  }

  def deserialize(s: String): JsonViewServerMessage = {
    val mapper = getMapper
    logger.info(s);
    mapper.readValue(s, classOf[JsonViewServerMessage])
  }


  def serialize(message: ViewServerMessage): String = {
    val mapper = getMapper
    mapper.writeValueAsString(message)
  }

}




