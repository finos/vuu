package org.finos.vuu.net.json

import com.fasterxml.jackson.core.{JsonGenerator, JsonParser}
import com.fasterxml.jackson.databind.*
import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.net.RowUpdate

import scala.jdk.CollectionConverters.IteratorHasAsScala

class RowUpdateDeserializer extends JsonDeserializer[RowUpdate] {

  override def deserialize(jsonParser: JsonParser, deserializationContext: DeserializationContext): RowUpdate = {

    val node: JsonNode = jsonParser.getCodec.readTree(jsonParser)

    val vpId = node.get("viewPortId").asText()
    val vpSize = node.get("vpSize").asInt()
    val rowIndex = node.get("rowIndex").asInt()
    val ts = node.get("ts").asLong()
    val rowKey = node.get("rowKey").asText()
    val updateType = node.get("updateType").asText()
    val selected = node.get("sel").asInt()
    val vpRequestId = node.get("vpVersion").asText()

    val data = IteratorHasAsScala(node.withArray("data").asInstanceOf[JsonNode].elements()).asScala.toList

    val dataAsArray = data.map(_.asText()).toArray[Any]

    RowUpdate(vpRequestId, vpId, vpSize, rowIndex, rowKey, updateType, ts, selected, dataAsArray)
  }
}

class RowUpdateSerializer extends JsonSerializer[RowUpdate] with StrictLogging  {

  override def serialize(value: RowUpdate, gen: JsonGenerator, serializerProvider: SerializerProvider): Unit = {
    gen.writeStartObject()
    gen.writeStringField("viewPortId", value.viewPortId)
    gen.writeNumberField("vpSize", value.vpSize)
    gen.writeNumberField("rowIndex", value.rowIndex)
    gen.writeStringField("rowKey", value.rowKey)
    gen.writeStringField("updateType", value.updateType)
    gen.writeNumberField("ts", value.ts)
    gen.writeNumberField("sel", value.selected)
    gen.writeStringField("vpVersion", value.vpVersion)
    gen.writeArrayFieldStart("data")

    value.data.zipWithIndex.foreach {
      case null => gen.writeString("")
      case (null, _) => gen.writeString("")
      case (None, _) => gen.writeString("")
      case (s: String, _) => gen.writeString(s)
      case (i: Int, _) => gen.writeNumber(i)
      case (d: Double, _) => gen.writeNumber(d)
      case (l: Long, _) => gen.writeNumber(l)
      case (b: Boolean, _) => gen.writeBoolean(b)
      case (c: Char, _) => gen.writeString(c.toString)
      case (unknown: Any, index) =>
        logger.warn(s"Unexpected type ${unknown.getClass} at index $index")
        gen.writeString("")
    }

    gen.writeEndArray()
    gen.writeEndObject()
  }
}
