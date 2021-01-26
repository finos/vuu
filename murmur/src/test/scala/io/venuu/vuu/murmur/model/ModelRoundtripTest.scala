/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 07/05/2020.
 *
 */
package io.venuu.vuu.murmur.model

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import io.venuu.toolbox.json.JsonUtil
import org.scalatest.{FeatureSpec, Matchers}

class ModelRoundtripTest extends FeatureSpec with Matchers {

  def getMapper = {
    val mapper = new ObjectMapper()
    mapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES, true)
    mapper.configure(JsonParser.Feature.ALLOW_SINGLE_QUOTES, true)
    //mapper.addMixIn(classOf[MessageBody], classOf[CoreJsonSerializationMixin])
    mapper.registerModule(DefaultScalaModule)
    mapper
  }

  feature("check we can roundtrip the config"){

    scenario("roundtrip the config"){

      val config =  ModelConfig(
          AppOptions("/opt/venuu/murmur", "${root-dir}/apps", "murmur", ".cache", Map("x"-> "y", "y" -> "z") , true, "dev"),
        List(
          ClassConfig("gatek", "start-gate-keeper.sh", "gatekeeper.log", "Mo Tu We Th Fr Sa Su", List(), "Europe/London", List(), List(), "-Dfoo=blah", 0, "none", false),
          ClassConfig("mmr",  "start-murmur.sh",        "murmur.log",      "Mo Tu We Th Fr Sa Su", List("03:00:01"), "Europe/London", List(), List(), "-Dfoo=blah", 0, "none", false),
        ),
        Map(
          "host-001" -> List(
            Process("gatek", "gatek-001", 0, "", "", ""),
            Process("mmr", "mmr-001", 0, "", "", ""),
        ),
          "host-002" -> List(
            Process("gatek", "gatek-002", 0, ""),
            Process("mmr", "mmr-002", 0, ""),
        )),
        List(
          Host("host-001", "host-001",
                            List(IpHostName("192.168.0.1", "host-001.web.prod.venuu.io", "bond0", "web-traffic")),
                            List(
                              CpuSocket("01", 12),
                              CpuSocket("02", 12)
                            )
          ),
          Host("host-002", "host-002",
            List(IpHostName("192.168.0.2", "host-002.web.prod.venuu.io", "bond0", "web-traffic")),
                    List(
                      CpuSocket("01", 12),
                      CpuSocket("02", 12),
                    )
          )
        )
      )
      val json = JsonUtil.toPrettyJson(config)
      println(json)
      
      val mapper = getMapper

      val model = mapper.readValue(json,classOf[ModelConfig])
      println(  model )

      //check we are all correct, after roundtripping.
      model should  equal(config)
    }
  }
}
