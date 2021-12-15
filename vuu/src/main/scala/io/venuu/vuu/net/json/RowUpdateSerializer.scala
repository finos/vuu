package io.venuu.vuu.net.json

import com.fasterxml.jackson.core.{JsonGenerator, JsonParser}
import com.fasterxml.jackson.databind._
import io.venuu.vuu.net.RowUpdate

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

    val data = IteratorHasAsScala(node.withArray("data").asInstanceOf[JsonNode].elements()).asScala.toList

    val dataAsArray = data.map(_.asText()).toArray[Any]

    RowUpdate(vpId, vpSize, rowIndex, rowKey, updateType, ts, selected, dataAsArray)
  }
}

class RowUpdateSerializer extends JsonSerializer[RowUpdate] {

  override def serialize(value: RowUpdate, gen: JsonGenerator, serializerProvider: SerializerProvider): Unit = {
    gen.writeStartObject()
    gen.writeStringField("viewPortId", value.viewPortId)
    gen.writeNumberField("vpSize", value.vpSize)
    gen.writeNumberField("rowIndex", value.rowIndex)
    gen.writeStringField("rowKey", value.rowKey)
    gen.writeStringField("updateType", value.updateType)
    gen.writeNumberField("ts", value.ts)
    gen.writeNumberField("sel", value.selected)
    gen.writeArrayFieldStart("data")

    value.data.foreach(datum => datum match {
      case null => gen.writeString("")
      case None => gen.writeString("")
      case s: String => gen.writeString(s)
      case i: Int => gen.writeNumber(i)
      case d: Double => gen.writeNumber(d)
      case l: Long => gen.writeNumber(l)
      case b: Boolean => gen.writeBoolean(b)
      case c: Char => gen.writeString(c.toString)
      case _ =>
        println("WTF...")
    }
    )

    gen.writeEndArray()
    gen.writeEndObject()
  }
}
