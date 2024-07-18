package org.finos.toolbox.json

import com.fasterxml.jackson.core.{JsonParser, StreamReadFeature}
import com.fasterxml.jackson.databind.json.JsonMapper
import com.fasterxml.jackson.module.scala.{ClassTagExtensions, DefaultScalaModule, JavaTypeable}

object JsonUtil {
  val mapper: JsonMapper with ClassTagExtensions = JsonMapper
    .builder()
    .configure(JsonParser.Feature.ALLOW_SINGLE_QUOTES, true)
    .configure(JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES, true)
    .addModule(DefaultScalaModule)
    .build() :: ClassTagExtensions

  def toPrettyJson(o: Object): String = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(o)

  def toRawJson(o: Object): String = mapper.writer().writeValueAsString(o)

  def fromJson[T: JavaTypeable](str: String): T = mapper.readValue[T](str)
}
