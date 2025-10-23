package org.finos.vuu.net.json

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.module.SimpleModule
import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.net.RowUpdate
import org.junit.Assert.assertEquals
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

    assertEquals("{\"viewPortId\":\"Vp1\",\"vpSize\":1,\"rowIndex\":0,\"rowKey\":\":KEY1\"," +
      "\"updateType\":\"U\",\"ts\":100,\"sel\":0,\"vpVersion\":\"Request1\"," +
      "\"data\":[\"foo\",\"bar\",1,\"\"]}", serialized)

    val deserialized = mapper.readValue(serialized, classOf[RowUpdate])

    assertEquals(rowUpdate.vpVersion, deserialized.vpVersion)
    assertEquals(rowUpdate.viewPortId, deserialized.viewPortId)
    assertEquals(rowUpdate.vpSize, deserialized.vpSize)
    assertEquals(rowUpdate.rowIndex, deserialized.rowIndex)
    assertEquals(rowUpdate.rowKey, deserialized.rowKey)
    assertEquals(rowUpdate.updateType, deserialized.updateType)
    assertEquals(rowUpdate.ts, deserialized.ts)
    assertEquals(rowUpdate.selected, deserialized.selected)
    assertEquals(4, deserialized.data.length)
    assertEquals("foo", deserialized.data(0))
    assertEquals("bar", deserialized.data(1))
    assertEquals("1", deserialized.data(2))
    assertEquals("", deserialized.data(3))
  }

}

