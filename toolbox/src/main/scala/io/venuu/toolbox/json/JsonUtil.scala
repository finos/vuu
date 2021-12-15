package io.venuu.toolbox.json

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.scala.DefaultScalaModule

object JsonUtil {
    def toPrettyJson(o: Object): String = {
      val mapper = new ObjectMapper()
      mapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES, true)
      mapper.configure(JsonParser.Feature.ALLOW_SINGLE_QUOTES, true)
      mapper.registerModule(DefaultScalaModule)
      mapper.writerWithDefaultPrettyPrinter().writeValueAsString(o)
    }

  def toRawJson(o: Object): String = {
    val mapper = new ObjectMapper()
    mapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES, true)
    mapper.configure(JsonParser.Feature.ALLOW_SINGLE_QUOTES, true)
    mapper.registerModule(DefaultScalaModule)
    mapper.writer().writeValueAsString(o)
  }
}
