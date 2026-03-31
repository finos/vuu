package org.finos.vuu.net.json.mixin

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.datatype.{EpochTimestamp, ScaledDecimal}
import org.finos.vuu.net.RowUpdate
import org.finos.vuu.viewport.ViewPortMenu
import tools.jackson.core.{JsonGenerator, JsonParser}
import tools.jackson.databind.annotation.{JsonDeserialize, JsonSerialize}
import tools.jackson.databind.deser.std.StdDeserializer
import tools.jackson.databind.node.ArrayNode
import tools.jackson.databind.ser.std.StdSerializer
import tools.jackson.databind.{DeserializationContext, JsonNode, SerializationContext}

import scala.jdk.CollectionConverters.*

@JsonSerialize(`using` = classOf[RowUpdateSerializer])
@JsonDeserialize(`using` = classOf[RowUpdateDeserializer])
trait RowUpdateMixin { }

class RowUpdateSerializer extends StdSerializer[RowUpdate](classOf[ViewPortMenu]) with StrictLogging  {

  override def serialize(value: RowUpdate, gen: JsonGenerator, ctxt: SerializationContext): Unit = {
    gen.writeStartObject()
    gen.writeStringProperty("viewPortId", value.viewPortId)
    gen.writeNumberProperty("vpSize", value.vpSize)
    gen.writeNumberProperty("rowIndex", value.rowIndex)
    gen.writeStringProperty("rowKey", value.rowKey)
    gen.writeStringProperty("updateType", value.updateType)
    gen.writeNumberProperty("ts", value.ts)
    gen.writeNumberProperty("sel", value.selected)
    gen.writeStringProperty("vpVersion", value.vpVersion)
    gen.writeArrayPropertyStart("data")

    value.data.zipWithIndex.foreach {
      case null => gen.writeString("")
      case (null, _) => gen.writeString("")
      case (None, _) => gen.writeString("")
      case (s: String, _) => gen.writeString(s)
      case (i: Int, _) => gen.writeNumber(i)
      case (d: Double, _) => gen.writeNumber(d)
      case (l: Long, _) => gen.writeString(l.toString)
      case (b: Boolean, _) => gen.writeBoolean(b)
      case (c: Char, _) => gen.writeString(c.toString)
      case (epoch: EpochTimestamp, _) => gen.writeNumber(epoch.millis)
      case (scaledDecimal: ScaledDecimal, _) => gen.writeString(scaledDecimal.scaledValue.toString)
      case (unknown: Any, index) =>
        logger.warn(s"Unexpected type ${unknown.getClass} at index $index")
        gen.writeString("")
    }

    gen.writeEndArray()
    gen.writeEndObject()
  }
}

class RowUpdateDeserializer extends StdDeserializer[RowUpdate](classOf[RowUpdate]) {

  override def deserialize(parser: JsonParser, ctxt: DeserializationContext): RowUpdate = {

    val node: JsonNode = ctxt.readTree(parser)

    val vpId = node.get("viewPortId").asString()
    val vpSize = node.get("vpSize").asInt()
    val rowIndex = node.get("rowIndex").asInt()
    val ts = node.get("ts").asLong()
    val rowKey = node.get("rowKey").asString()
    val updateType = node.get("updateType").asString()
    val selected = node.get("sel").asInt()
    val vpRequestId = node.get("vpVersion").asString()

    val dataAsArray: Array[Any] = if (node.has("data") && node.get("data").isArray) {
      val dataArray = node.get("data").asInstanceOf[ArrayNode]
      dataArray.asScala.view.map(_.asString()).toArray
    } else {
      Array.empty
    }

    RowUpdate(vpRequestId, vpId, vpSize, rowIndex, rowKey, updateType, ts, selected, dataAsArray)
  }
}