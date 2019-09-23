/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 18/11/2015.

  */
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
}
