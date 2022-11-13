package org.finos.vuu.net

import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.databind.annotation.{JsonDeserialize, JsonSerialize, JsonTypeIdResolver}
import org.finos.vuu.api.AvailableViewPortVisualLink
import org.finos.vuu.net.json.{RowUpdateDeserializer, RowUpdateSerializer}
import org.finos.vuu.net.rpc.VsJsonTypeResolver
import org.finos.vuu.viewport.{ViewPortAction, ViewPortMenu, ViewPortRange, ViewPortTable}

trait FailureMessage {
  def error: String
}

case class NotLoggedInFailure(error: String) extends FailureMessage

trait ViewServerMessage {
  def requestId: String

  def sessionId: String

  def user: String

  def token: String

  def body: MessageBody

  def module: String
}

object VsMsg {
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

case class GetTableListResponse(tables: Array[ViewPortTable]) extends MessageBody

case class GetTableMetaRequest(table: ViewPortTable) extends MessageBody

case class GetTableMetaResponse(table: ViewPortTable, columns: Array[String], dataTypes: Array[String], key: String) extends MessageBody

case class GetViewPortMenusRequest(vpId: String) extends MessageBody

case class GetViewPortMenusResponse(vpId: String, menu: ViewPortMenu) extends MessageBody

case class ErrorResponse(msg: String) extends MessageBody

case class SortDef(column: String, sortType: Char)

case class SortSpec(sortDefs: List[SortDef])

case class FilterSpec(filter: String)

case class Aggregations(column: String, aggType: Int)

object AggType {
  val Sum = 1
  val Average = 2
  val Count = 3
}

case class GroupBySpec(columns: Array[String], aggregations: List[AggregationSpec] = List())

case class AggregationSpec(aggregationType: String, column: String)

case class CreateViewPortRequest(table: ViewPortTable, range: ViewPortRange, columns: Array[String], sort: SortSpec = SortSpec(List()), groupBy: Array[String] = Array(), filterSpec: FilterSpec = null, aggregations: Array[Aggregations] = Array()) extends MessageBody

case class CreateViewPortSuccess(viewPortId: String, table: String, range: ViewPortRange, columns: Array[String], sort: SortSpec = SortSpec(List()), groupBy: Array[String] = Array(), filterSpec: FilterSpec = null, aggregations: Array[Aggregations] = Array()) extends MessageBody

case class CreateViewPortReject(table: ViewPortTable, msg: String) extends MessageBody

case class RemoveViewPortRequest(viewPortId: String) extends MessageBody

case class RemoveViewPortSuccess(viewPortId: String) extends MessageBody

case class RemoveViewPortReject(viewPortId: String) extends MessageBody

case class DisableViewPortRequest(viewPortId: String) extends MessageBody

case class DisableViewPortSuccess(viewPortId: String) extends MessageBody

case class DisableViewPortReject(viewPortId: String) extends MessageBody

case class EnableViewPortRequest(viewPortId: String) extends MessageBody

case class EnableViewPortSuccess(viewPortId: String) extends MessageBody

case class EnableViewPortReject(viewPortId: String) extends MessageBody

case class ChangeViewPortRequest(viewPortId: String, columns: Array[String], sort: SortSpec = SortSpec(List()), groupBy: Array[String] = Array(), filterSpec: FilterSpec = null, aggregations: Array[Aggregations] = Array()) extends MessageBody

case class ChangeViewPortSuccess(viewPortId: String, columns: Array[String], sort: SortSpec = SortSpec(List()), groupBy: Array[String] = Array(), filterSpec: FilterSpec = null, aggregations: Array[Aggregations] = Array()) extends MessageBody

case class ChangeViewPortReject(viewPortId: String, msg: String) extends MessageBody

case class ChangeViewPortRange(viewPortId: String, from: Int, to: Int) extends MessageBody

case class ChangeViewPortRangeSuccess(viewPortId: String, from: Int, to: Int) extends MessageBody

case class OpenTreeNodeRequest(vpId: String, treeKey: String) extends MessageBody

case class ViewPortMenuRpcCall()

case class ViewPortMenuSelectionRpcCall(vpId: String, rpcName: String) extends MessageBody

case class ViewPortMenuCellRpcCall(vpId: String, rpcName: String, rowKey: String, field: String, value: Object) extends MessageBody

case class ViewPortMenuTableRpcCall(vpId: String, rpcName: String) extends MessageBody

case class ViewPortMenuRowRpcCall(vpId: String, rpcName: String, rowKey: String, row: Map[String, Object]) extends MessageBody

case class ViewPortMenuRpcResponse(vpId: String, rpcName: String, action: ViewPortAction) extends MessageBody

case class ViewPortMenuRpcReject(vpId: String, rpcName: String, error: String) extends MessageBody

case class CloseTreeNodeRequest(vpId: String, treeKey: String) extends MessageBody

case class CloseTreeNodeSuccess(vpId: String, treeKey: String) extends MessageBody

case class CloseTreeNodeReject(vpId: String, treeKey: String) extends MessageBody

case class HeartBeat(ts: Long) extends MessageBody

case class HeartBeatResponse(ts: Long) extends MessageBody

case class Error(message: String, code: Int)

case class MenuRpcCall(module: String, method: String, params: Array[Any], namedParams: Map[String, Any]) extends MessageBody

case class MenuRpcResponse(module: String, method: String, result: ViewPortAction) extends MessageBody

case class RpcCall(service: String, method: String, params: Array[Any], namedParams: Map[String, Any]) extends MessageBody

case class RpcResponse(method: String, result: Any, error: Error) extends MessageBody

case class RpcUpdate(table: ViewPortTable, key: String, data: Map[String, Any]) extends MessageBody

case class RpcSuccess(table: ViewPortTable, key: String) extends MessageBody

case class RpcReject(table: ViewPortTable, key: String, reason: String) extends MessageBody

case class TableRowUpdates(batch: String, isLast: Boolean, timeStamp: Long, rows: Array[RowUpdate]) extends MessageBody

case class OpenTreeNodeSuccess(vpId: String, treeKey: String) extends MessageBody

case class OpenTreeNodeReject(vpId: String, treeKey: String) extends MessageBody

case class SetSelectionRequest(vpId: String, selection: Array[Int]) extends MessageBody

case class SetSelectionSuccess(vpId: String, selection: Array[Int]) extends MessageBody

case class GetViewPortVisualLinksRequest(vpId: String) extends MessageBody

case class GetViewPortVisualLinksResponse(vpId: String, links: List[AvailableViewPortVisualLink]) extends MessageBody

case class CreateVisualLinkRequest(childVpId: String, parentVpId: String, childColumnName: String, parentColumnName: String) extends MessageBody

case class CreateVisualLinkSuccess(childVpId: String, parentVpId: String, childColumnName: String, parentColumnName: String) extends MessageBody

case class RemoveVisualLinkRequest(childVpId: String) extends MessageBody

case class RemoveVisualLinkSuccess(childVpId: String) extends MessageBody

object UpdateType {
  final val SizeOnly = "SIZE"
  final val Update = "U"
}


@JsonSerialize(using = classOf[RowUpdateSerializer])
@JsonDeserialize(using = classOf[RowUpdateDeserializer])
case class RowUpdate(vpVersion: String, viewPortId: String, vpSize: Int, rowIndex: Int, rowKey: String, updateType: String, ts: Long, selected: Int, data: Array[Any])

