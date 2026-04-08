package org.finos.vuu.net.json

import tools.jackson.core.StreamReadConstraints
import tools.jackson.core.json.{JsonFactory, JsonReadFeature}
import tools.jackson.databind.json.JsonMapper
import tools.jackson.databind.jsontype.BasicPolymorphicTypeValidator
import tools.jackson.module.scala.{ClassTagExtensions, DefaultScalaModule}

object JsonMapperFactory {

  private val factory = JsonFactory.builder()
    .streamReadConstraints(
      StreamReadConstraints.builder()
      .maxNestingDepth(30)
      .maxStringLength(1_000_000)
      .build())
    .build()

  private val validator = BasicPolymorphicTypeValidator.builder()
    .allowIfBaseType("org.finos.vuu.")
    .build()

  private val mapper: JsonMapper with ClassTagExtensions = {
    JsonMapper
      .builder(factory)
      .polymorphicTypeValidator(validator)
      .configure(JsonReadFeature.ALLOW_SINGLE_QUOTES, true)
      .configure(JsonReadFeature.ALLOW_UNQUOTED_PROPERTY_NAMES, true)
      .addModule(DefaultScalaModule())
      .addModule(VuuJacksonModule())
      .build() :: ClassTagExtensions
  }

  def build: JsonMapper with ClassTagExtensions = mapper

}

