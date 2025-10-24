package org.finos.vuu.client.messages

import org.finos.vuu.api.AvailableViewPortVisualLink
import org.finos.vuu.net.{Aggregations, Error, FilterSpec, SortSpec}
import org.finos.vuu.viewport.{ViewPortAction, ViewPortMenu, ViewPortTable}

import java.util.UUID
import java.util.concurrent.atomic.AtomicLong

object RequestId {

  private val requestId: AtomicLong = new AtomicLong(0);

  def oneNew(): String = {
    "REQ-" + requestId.getAndIncrement()
  }
}

object SessionId {
  def oneNew(): String = {
    "SESS-" + UUID.randomUUID().toString
  }
}

object ViewPortId {
  private val viewportId: AtomicLong = new AtomicLong(0);

  def oneNew(): String = {
    "VP-" + "%08d".format(viewportId.getAndIncrement())
  }
}

trait ClientMessage

trait FromServer

trait ToServer

case class UserPrincipal(user: String, token: String, sessionId: String)

case class Logon(user: String, password: String) extends ClientMessage with ToServer

case class LogonSuccess(body: UserPrincipal) extends ClientMessage with FromServer

case class LogonFailure(err: String) extends ClientMessage with FromServer

case class ClientCreateViewPort(requestId: String, table: ViewPortTable, columns: Array[String], sortBy: SortSpec, groupBy: Array[String], from: Int, to: Int, filter: String) extends ClientMessage with ToServer

case class ClientCreateViewPortSuccess(requestId: String, vpId: String, columns: Array[String], sortBy: SortSpec, groupBy: Array[String], filter: String) extends ClientMessage with FromServer

case class ClientCreateViewPortFailure(requestId: String, vpId: String, error: String) extends ClientMessage with FromServer

case class ClientChangeViewPortRequest(requestId: String, viewPortId: String, columns: Array[String], sortBy: SortSpec = SortSpec(List()), groupBy: Array[String] = Array(), filterSpec: FilterSpec = null, aggregations: Array[Aggregations] = Array()) extends ClientMessage with ToServer

case class ClientChangeViewPortSuccess(requestId: String, viewPortId: String, columns: Array[String], sortBy: SortSpec = SortSpec(List()), groupBy: Array[String] = Array(), filterSpec: FilterSpec = null) extends ClientMessage with FromServer

case class ClientChangeViewPortFailure(requestId: String, viewPortId: String, columns: Array[String], sortBy: SortSpec = SortSpec(List()), groupBy: Array[String] = Array(), filterSpec: FilterSpec = null) extends ClientMessage with FromServer

case class ClientUpdateVPRange(requestId: String, vpId: String, from: Int, to: Int) extends ClientMessage with ToServer

case class ClientServerRowUpdate(vpId: String, index: Int, data: Array[AnyRef], size: Int, selected: Int) extends ClientMessage with FromServer

case class ClientGetTableList(requestId: String) extends ClientMessage

case class ClientGetTableListResponse(requestId: String, tables: Array[ViewPortTable]) extends ClientMessage

case class ClientGetTableMeta(requestId: String, table: ViewPortTable) extends ClientMessage

case class ClientGetTableMetaResponse(requestId: String, table: ViewPortTable, columns: Array[String], dataTypes: Array[String], key: String) extends ClientMessage

case class ClientGetViewPortMenusRequest(requestId: String, vpId: String) extends ClientMessage

case class ClientGetViewPortMenusResponse(requestId: String, vpId: String, menu: ViewPortMenu) extends ClientMessage

case class ClientMenuSelectionRpcCall(requestId: String, vpId: String, rpcName: String) extends ClientMessage

case class ClientMenuCellRpcCall(requestId: String, vpId: String, rpcName: String, rowKey: String, field: String, value: Object) extends ClientMessage

case class ClientMenuTableRpcCall(requestId: String, vpId: String, rpcName: String) extends ClientMessage

case class ClientMenuRowRpcCall(requestId: String, vpId: String, rpcName: String, rowKey: String, row: Map[String, Object]) extends ClientMessage

case class ClientMenuRpcResponse(requestId: String, vpId: String, action: ViewPortAction) extends ClientMessage

//GetViewPortMenusRequest

case class ClientRpcTableUpdate(requestId: String, table: ViewPortTable, key: String, data: Map[String, Any]) extends ClientMessage

case class ClientRpcTableUpdateSuccess(requestId: String, table: ViewPortTable, key: String, data: Map[String, Any]) extends ClientMessage

case class ClientRpcCall(requestId: String, service: String, method: String, params: Array[Any], namedParams: Map[String, Any], module: String) extends ClientMessage

case class ClientRpcResponse(requestId: String, service: String, method: String, result: Any, error: Error) extends ClientMessage

case class ClientOpenTreeNodeRequest(requestId: String, vpId: String, treeKey: String) extends ClientMessage with ToServer

case class ClientCloseTreeNodeRequest(requestId: String, vpId: String, treeKey: String) extends ClientMessage with ToServer

case class ClientChangeViewPortRangeSuccess(vpId: String, from: Int, to: Int) extends ClientMessage

case class ClientSetSelection(requestId: String, vpId: String, selection: Array[Int]) extends ClientMessage with ToServer

case class ClientGetVisualLinks(requestId: String, vpId: String) extends ClientMessage with ToServer

case class ClientGetVisualLinksResponse(requestId: String, vpId: String, vpLinks: List[AvailableViewPortVisualLink]) extends ClientMessage with ToServer

case class ClientCreateVisualLink(requestId: String, childVpId: String, parentVpId: String, childColumnName: String, parentColumnName: String) extends ClientMessage with ToServer

case class ClientCreateVisualLinkSuccess(requestId: String, childVpId: String, parentVpId: String, childColumnName: String, parentColumnName: String) extends ClientMessage with ToServer

case class ClientRemoveViewPort(requestId: String, vpId: String) extends ClientMessage with ToServer

case class ClientRemoveViewPortSuccess(vpId: String) extends ClientMessage

case class ClientRemoveViewPortReject(vpId: String) extends ClientMessage

case class ClientDisableViewPort(requestId: String, vpId: String) extends ClientMessage with ToServer

case class ClientDisableViewPortSuccess(vpId: String) extends ClientMessage

case class ClientDisableViewPortReject(vpId: String) extends ClientMessage

case class ClientEnableViewPort(requestId: String, vpId: String) extends ClientMessage with ToServer

case class ClientEnableViewPortSuccess(vpId: String) extends ClientMessage

case class ClientEnableViewPortReject(vpId: String) extends ClientMessage
