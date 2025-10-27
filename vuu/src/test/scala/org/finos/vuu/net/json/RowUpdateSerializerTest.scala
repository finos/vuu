package org.finos.vuu.net.json

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.module.SimpleModule
import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.net.RowUpdate
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class RowUpdateSerializerTest extends AnyFeatureSpec with Matchers with StrictLogging {

  Feature("Test round trip") {

    val rowUpdate = RowUpdate(
      vpVersion = "Request1",
      viewPortId = "Vp1",
      vpSize = 1,
      rowIndex = 0,
      rowKey = ":KEY1",
      updateType = "U",
      ts = 100L,
      selected = 0,
      data = Array(
        "foo",
        "bar",
        1,
        BigInt(123) //Unsupported by Vuu
      )
    )

    val mapper = new ObjectMapper()
    val module = new SimpleModule()
    module.addSerializer(classOf[RowUpdate], new RowUpdateSerializer)
    module.addDeserializer(classOf[RowUpdate], new RowUpdateDeserializer)
    mapper.registerModule(module)

    val serialized = mapper.writeValueAsString(rowUpdate)

    serialized shouldEqual "{\"viewPortId\":\"Vp1\",\"vpSize\":1,\"rowIndex\":0,\"rowKey\":\":KEY1\"," +
      "\"updateType\":\"U\",\"ts\":100,\"sel\":0,\"vpVersion\":\"Request1\"," +
      "\"data\":[\"foo\",\"bar\",1,\"\"]}"

    val deserialized = mapper.readValue(serialized, classOf[RowUpdate])

    deserialized.vpVersion shouldEqual rowUpdate.vpVersion
    deserialized.viewPortId shouldEqual rowUpdate.viewPortId
    deserialized.vpSize shouldEqual rowUpdate.vpSize
    deserialized.rowIndex shouldEqual rowUpdate.rowIndex
    deserialized.rowKey shouldEqual rowUpdate.rowKey
    deserialized.updateType shouldEqual rowUpdate.updateType
    deserialized.ts shouldEqual rowUpdate.ts
    deserialized.selected shouldEqual rowUpdate.selected
    
    deserialized.data.length shouldEqual 4
    deserialized.data(0) shouldEqual "foo"
    deserialized.data(1) shouldEqual "bar"
    deserialized.data(2) shouldEqual "1"
    deserialized.data(3) shouldEqual ""
  }

}

