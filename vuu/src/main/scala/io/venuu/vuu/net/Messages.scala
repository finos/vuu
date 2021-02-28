/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 08/01/2016.

  */
package io.venuu.vuu.net

import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.core.{JsonGenerator, JsonParser}
import com.fasterxml.jackson.databind._
import com.fasterxml.jackson.databind.annotation.{JsonDeserialize, JsonSerialize, JsonTypeIdResolver}
import io.venuu.vuu.api.AvailableViewPortVisualLink
import io.venuu.vuu.net.rpc.VsJsonTypeResolver
import io.venuu.vuu.viewport.ViewPortRange

import scala.jdk.CollectionConverters._

trait FailureMessage{
  def error: String
}

case class NotLoggedInFailure(error: String) extends FailureMessage

trait ViewServerMessage{
  def requestId: String
  def sessionId: String
  def user: String
  def token: String
  def body: MessageBody
  def module: String
}

object VsMsg{
  def apply(requestId: String, sessionId: String, token: String, user: String, body: MessageBody, module: String = "CORE") = {
    JsonViewServerMessage(requestId, sessionId, token, user, body, module)
  }
}

case class JsonViewServerMessage(requestId: String, sessionId: String, token: String, user: String, body: MessageBody, module: String = "CORE") extends ViewServerMessage

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonTypeIdResolver(classOf[VsJsonTypeResolver])
trait MessageBody

case class AuthenticateRequest(username: String, password: String) extends MessageBody
case class AuthenticateSuccess(token: String) extends MessageBody
case class AuthenticateFailure(msg: String) extends MessageBody

case class LoginRequest(token: String, user: String) extends MessageBody
case class LoginSuccess(token: String) extends MessageBody
case class LoginFailure(token: String, errorMsg: String) extends MessageBody

case class GetTableList() extends MessageBody
case class GetTableListResponse(tables: Array[String]) extends MessageBody

case class GetTableMetaRequest(table: String) extends MessageBody
case class GetTableMetaResponse(table: String, columns: Array[String], dataTypes: Array[String], key: String) extends MessageBody

case class ErrorResponse(msg: String) extends MessageBody

case class SortDef(column: String, sortType:Char)
case class SortSpec(sortDefs: List[SortDef])
case class FilterSpec(filter: String)
case class Aggregations(column: String, aggType: Int)

object AggType{
  val Sum = 1
  val Average = 2
  val Count = 3
}

case class GroupBySpec(columns: Array[String], aggregations: List[AggregationSpec] = List())
case class AggregationSpec(aggregationType: String, column: String)

case class CreateViewPortRequest(table: String, range: ViewPortRange, columns: Array[String], sort: SortSpec = SortSpec(List()), groupBy: Array[String] = Array(), filterSpec: FilterSpec = null, aggregations: Array[Aggregations] = Array()) extends MessageBody
case class CreateViewPortSuccess(viewPortId: String, table: String, range: ViewPortRange, columns: Array[String], sort: SortSpec = SortSpec(List()), groupBy: Array[String] = Array(), filterSpec: FilterSpec = null) extends MessageBody
case class CreateViewPortReject(table: String, msg: String) extends MessageBody

case class ChangeViewPortRequest(viewPortId: String, columns: Array[String], sort: SortSpec = SortSpec(List()), groupBy: Array[String] = Array(), filterSpec: FilterSpec = null, aggregations: Array[Aggregations] = Array()) extends MessageBody
case class ChangeViewPortSuccess(viewPortId: String, columns: Array[String], sort: SortSpec = SortSpec(List()), groupBy: Array[String] = Array(), filterSpec: FilterSpec = null) extends MessageBody
case class ChangeViewPortReject(viewPortId: String, msg: String) extends MessageBody

case class ChangeViewPortRange(viewPortId: String, from: Int, to: Int) extends MessageBody
case class ChangeViewPortRangeSuccess(viewPortId: String, from: Int, to: Int) extends MessageBody

case class OpenTreeNodeRequest(vpId: String, treeKey: String) extends MessageBody

case class CloseTreeNodeRequest(vpId: String, treeKey: String) extends MessageBody
case class CloseTreeNodeSuccess(vpId: String, treeKey: String) extends MessageBody
case class CloseTreeNodeReject(vpId: String, treeKey: String) extends MessageBody

case class HeartBeat(ts: Long) extends MessageBody
case class HeartBeatResponse(ts: Long) extends MessageBody

case class Error(message: String, code: Int)

case class RpcCall(method: String, params: Array[Any], namedParams: Map[String, Any]) extends MessageBody
case class RpcResponse(method: String, result: Any, error: Error) extends MessageBody

case class RpcUpdate(table: String, key: String, data: Map[String, Any]) extends MessageBody
case class RpcSuccess(table: String, key: String) extends MessageBody
case class RpcReject(table: String, key: String, reason: String) extends MessageBody

case class TableRowUpdates(batch: String, isLast: Boolean, timeStamp: Long, rows: Array[RowUpdate]) extends MessageBody

case class OpenTreeNodeSuccess(vpId: String, treeKey: String) extends MessageBody
case class OpenTreeNodeReject(vpId: String, treeKey: String) extends MessageBody

case class SetSelectionRequest(vpId: String, selection: Array[Int]) extends MessageBody
case class SetSelectionSuccess(vpId: String, selection: Array[Int]) extends MessageBody

case class GetViewPortVisualLinksRequest(vpId: String) extends MessageBody
case class GetViewPortVisualLinksResponse(vpId: String, links: List[AvailableViewPortVisualLink]) extends MessageBody
case class CreateVisualLinkRequest(childVpId: String, parentVpId: String, childColumnName: String, parentColumnName: String) extends MessageBody
case class CreateVisualLinkSuccess(childVpId: String, parentVpId: String, childColumnName: String, parentColumnName: String) extends MessageBody

object UpdateType{
  final val SizeOnly = "SIZE"
  final val Update = "U"
}


@JsonSerialize(using = classOf[RowUpdateSerializer])
@JsonDeserialize(using = classOf[RowUpdateDeserializer])
case class RowUpdate(viewPortId: String, vpSize: Int, rowIndex: Int, rowKey: String, updateType: String, ts: Long, selected: Int, data: Array[Any])

class RowUpdateDeserializer extends JsonDeserializer[RowUpdate]{

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

    value.data.foreach( datum => datum match{
      case null => gen.writeString("")
      case s: String => gen.writeString(s)
      case i: Int => gen.writeNumber(i)
      case d: Double => gen.writeNumber(d)
      case l: Long => gen.writeNumber(l)
      case b: Boolean => gen.writeBoolean(b)
      case c: Char => gen.writeString(c.toString)
    }
    )

    gen.writeEndArray()
    gen.writeEndObject()
  }
}