package org.finos.vuu.net.json.mixin

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.datatype.{EpochTimestamp, ScaledDecimal2}
import org.finos.vuu.net.RowUpdate
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.scala.DefaultScalaModule

class RowUpdateMixinTest extends AnyFeatureSpec with Matchers with StrictLogging {

  Feature("Check we can serialize and deserialize row updates") {

    val mapper = JsonMapper.builder()
      .addModule(DefaultScalaModule())
      .addMixIn(classOf[RowUpdate], classOf[RowUpdateMixin])
      .build()

    Scenario("Test multiple data types") {

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
          BigInt(123), //Unsupported by Vuu
          EpochTimestamp(456L),
          ScaledDecimal2(567L),
          678L,
        )
      )

      val serialized = mapper.writeValueAsString(rowUpdate)

      serialized shouldEqual "{\"viewPortId\":\"Vp1\",\"vpSize\":1,\"rowIndex\":0,\"rowKey\":\":KEY1\"," +
        "\"updateType\":\"U\",\"ts\":100,\"sel\":0,\"vpVersion\":\"Request1\"," +
        "\"data\":[\"foo\",\"bar\",1,\"\",456,\"567\",\"678\"]}"

      val deserialized = mapper.readValue(serialized, classOf[RowUpdate])

      deserialized.vpVersion shouldEqual rowUpdate.vpVersion
      deserialized.viewPortId shouldEqual rowUpdate.viewPortId
      deserialized.vpSize shouldEqual rowUpdate.vpSize
      deserialized.rowIndex shouldEqual rowUpdate.rowIndex
      deserialized.rowKey shouldEqual rowUpdate.rowKey
      deserialized.updateType shouldEqual rowUpdate.updateType
      deserialized.ts shouldEqual rowUpdate.ts
      deserialized.selected shouldEqual rowUpdate.selected

      deserialized.data.length shouldEqual 7
      deserialized.data(0) shouldEqual "foo"
      deserialized.data(1) shouldEqual "bar"
      deserialized.data(2) shouldEqual "1"
      deserialized.data(3) shouldEqual ""
      deserialized.data(4) shouldEqual "456"
      deserialized.data(5) shouldEqual "567"
      deserialized.data(6) shouldEqual "678"
    }

  }

}

