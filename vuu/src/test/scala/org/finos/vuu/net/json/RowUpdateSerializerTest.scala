package org.finos.vuu.net.json

import com.fasterxml.jackson.core.JsonFactory
import com.fasterxml.jackson.databind.ObjectMapper
import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.datatype.{Decimal, EpochTimestamp}
import org.finos.vuu.net.RowUpdate
import org.junit.Assert.assertEquals
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.io.StringWriter

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
            EpochTimestamp.apply(1),
            Decimal.apply(BigDecimal.apply("101.1"), 6)
          )
    )

    val mapper = new ObjectMapper()
    val jsonWriter = new StringWriter()
    val jsonGenerator = new JsonFactory().createGenerator(jsonWriter)
    val serializerProvider = mapper.getSerializerProvider
    new RowUpdateSerializer().serialize(rowUpdate, jsonGenerator, serializerProvider)
    jsonGenerator.flush()
    val serialized = jsonWriter.toString

    assertEquals("{\"viewPortId\":\"Vp1\",\"vpSize\":1,\"rowIndex\":0,\"rowKey\":\":KEY1\"," +
      "\"updateType\":\"U\",\"ts\":100,\"sel\":0,\"vpVersion\":\"Request1\"," +
      "\"data\":[\"foo\",\"bar\",1,1,101100000]}", serialized)


    new RowUpdateDeserializer().deserialize()

  }


}
