package org.finos.vuu.net.json

import tools.jackson.core.json.JsonReadFeature
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.scala.{ClassTagExtensions, DefaultScalaModule}

object JsonMapperFactory {

  private val mapper: JsonMapper with ClassTagExtensions = {
    JsonMapper
      .builder()
      .configure(JsonReadFeature.ALLOW_SINGLE_QUOTES, true)
      .configure(JsonReadFeature.ALLOW_UNQUOTED_PROPERTY_NAMES, true)
      .addModule(DefaultScalaModule())
      .addModule(VuuJacksonModule())
      .build() :: ClassTagExtensions
  }

  def get(): JsonMapper with ClassTagExtensions = mapper

}

