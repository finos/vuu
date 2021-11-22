/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 16/11/2015.

  */
package io.venuu.vuu.core

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.api.AvailableViewPortVisualLink
import io.venuu.vuu.core.table.{DataType, TableContainer}
import io.venuu.vuu.net._
import io.venuu.vuu.provider.{ProviderContainer, RpcProvider}
import io.venuu.vuu.viewport._

import scala.util.{Failure, Success, Try}

class CoreServerApiHander(val viewPortContainer: ViewPortContainer,
                          val tableContainer: TableContainer,
                          val providers: ProviderContainer)(implicit timeProvider: Clock) extends ServerApi with StrictLogging{


  override def process(msg: ViewPortMenuCellRpcCall)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.callRpcCell(msg.vpId, msg.rpcName, ctx.session, msg.rowKey, msg.field, msg.value)) match{
      case Success(action) =>
        logger.info("Processed VP Menu Cell RPC call" + msg)
        vsMsg(ViewPortMenuRpcResponse(msg.vpId, msg.rpcName, action))(ctx)
      case Failure(e) =>
        logger.info("Failed to remove viewport", e)
        vsMsg(ViewPortMenuRpcReject(msg.vpId, msg.rpcName, e.getMessage))(ctx)
    }
  }

  override def process(msg: ViewPortMenuRowRpcCall)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.callRpcRow(msg.vpId, msg.rpcName, ctx.session, msg.rowKey, msg.row)) match{
      case Success(action) =>
        logger.info("Processed VP Menu Row RPC call" + msg)
        vsMsg(ViewPortMenuRpcResponse(msg.vpId, msg.rpcName, action))(ctx)
      case Failure(e) =>
        logger.info("Failed to remove viewport", e)
        vsMsg(ViewPortMenuRpcReject(msg.vpId, msg.rpcName, e.getMessage))(ctx)
    }
  }

  override def process(msg: ViewPortMenuTableRpcCall)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.callRpcTable(msg.vpId, msg.rpcName, ctx.session)) match{
      case Success(action) =>
        logger.info("Processed VP Menu Table RPC call" + msg)
        vsMsg(ViewPortMenuRpcResponse(msg.vpId, msg.rpcName, action))(ctx)
      case Failure(e) =>
        logger.info("Failed to remove viewport", e)
        vsMsg(ViewPortMenuRpcReject(msg.vpId, msg.rpcName, e.getMessage))(ctx)
    }
  }

  override def process(msg: ViewPortMenuSelectionRpcCall)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.callRpcSession(msg.vpId, msg.rpcName, ctx.session)) match{
      case Success(action) =>
        logger.info("Processed VP Menu Selection RPC call" + msg)
        vsMsg(ViewPortMenuRpcResponse(msg.vpId, msg.rpcName, action))(ctx)
      case Failure(e) =>
        logger.info("Failed to remove viewport", e)
        vsMsg(ViewPortMenuRpcReject(msg.vpId, msg.rpcName, e.getMessage))(ctx)
    }
  }

  override def process(msg: RemoveViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.removeViewPort(msg.viewPortId)) match{
      case Success(_) =>
        logger.info("View port removed")
        vsMsg(RemoveViewPortSuccess(msg.viewPortId))(ctx)
      case Failure(e) =>
        logger.info("Failed to remove viewport", e)
        vsMsg(RemoveViewPortReject(msg.viewPortId))(ctx)
    }
  }

  override def process(msg: EnableViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.enableViewPort(msg.viewPortId)) match{
      case Success(_) =>
        logger.info("View port enabled")
        vsMsg(EnableViewPortSuccess(msg.viewPortId))(ctx)
      case Failure(e) =>
        logger.info("Failed to enable viewport", e)
        vsMsg(RemoveViewPortReject(msg.viewPortId))(ctx)
    }
  }

  override def process(msg: DisableViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.disableViewPort(msg.viewPortId)) match{
      case Success(_) =>
        logger.info("View port disabled")
        vsMsg(DisableViewPortSuccess(msg.viewPortId))(ctx)
      case Failure(e) =>
        logger.info("Failed to enable viewport", e)
        vsMsg(DisableViewPortReject(msg.viewPortId))(ctx)
    }
  }

  def vsMsg(body: MessageBody)(ctx: RequestContext): Option[JsonViewServerMessage] = {
    Some(VsMsg(ctx.requestId, ctx.session.sessionId, ctx.token, ctx.session.user, body))
  }

  override def process(msg: GetTableList)(ctx: RequestContext): Option[ViewServerMessage] = {
    vsMsg(GetTableListResponse(tableContainer.getTables()))(ctx)
  }

  override def process(msg: RpcUpdate)(ctx: RequestContext): Option[ViewServerMessage] = {
    val table = tableContainer.getTable(msg.table.table)

    if(table == null)
      vsMsg(RpcReject(msg.table, msg.key, s"could not find table ${msg.table} to update in table container"))(ctx)
    else{
      Try(providers.getProviderForTable(msg.table.table).get.asInstanceOf[RpcProvider].tick(msg.key, msg.data)) match{
        case Success(_) =>
          logger.info(s"Rpc update success ${msg.table} ${msg.key}")
          vsMsg(RpcSuccess(msg.table, msg.key))(ctx)
        case Failure(e) =>
          logger.error(s"Rpc update reject ${msg.table} ${msg.key}", e)
          vsMsg(RpcReject(msg.table, msg.key, e.toString))(ctx)
      }
    }
  }

  override def process(msg: HeartBeatResponse)(ctx: RequestContext): Option[ViewServerMessage] = {
    logger.info("HB [" + (timeProvider.now() - msg.ts) + "]")
    None
  }

  override def disconnect(session: ClientSessionId): Unit = {
    logger.info("On Disconnect")
    viewPortContainer.removeForSession(session)
    tableContainer.removeSessionTables(session)
  }


  override def process(msg: GetViewPortMenusRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    if(msg.vpId == null || msg.vpId == ""){
      errorMsg(s"VpId is empty")(ctx)
    }else{
      viewPortContainer.get(ctx.session, msg.vpId) match {
        case Some(vp: ViewPort) =>
          vsMsg(GetViewPortMenusResponse(msg.vpId, vp.getStructure.viewPortDef.service.menuItems()))(ctx)
        case None =>
          errorMsg(s"Viewport not found")(ctx)
      }
    }
  }

  override def process(msg: GetTableMetaRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    if(msg.table == null)
      errorMsg(s"Table ${msg.table} not found in container")(ctx)
    else{
      val table = tableContainer.getTable(msg.table.table)
      val columnNames = table.getTableDef.columns.map(_.name).sorted
      val dataTypes = columnNames.map(table.getTableDef.columnForName(_)).map(col => DataType.asString(col.dataType))
      vsMsg(GetTableMetaResponse(msg.table, columnNames, dataTypes, table.getTableDef.keyField))(ctx)
    }
  }


  override def process(msg: ChangeViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage] = {

    viewPortContainer.get(ctx.session, msg.viewPortId) match {
      case Some(viewport) =>

        val table = viewport.table.asTable

        val columns = if(msg.columns.size == 1 && msg.columns(0) == "*"){
          logger.info("[ChangeViewPortRequest] Wildcard specified for columns, going to return all")
          table.getTableDef.columns.toList
        }
        else
          msg.columns.map(table.getTableDef.columnForName(_)).toList

        val sort = msg.sort
        val filter = msg.filterSpec
        val groupBy = msg.groupBy

        val newViewPort = if(!groupBy.isEmpty){

          val groupByColumns = msg.groupBy
            .filter(table.getTableDef.columnExists(_))
            .map(table.getTableDef.columnForName(_)).toList

          val aggregations   = msg.aggregations
            .filter( agg => table.getTableDef.columnExists(agg.column))
            .map(agg => Aggregation(table.getTableDef.columnForName(agg.column), agg.aggType.toShort)).toList

          val groupBy = new GroupBy(groupByColumns, aggregations)

          viewPortContainer.change(ctx.session, msg.viewPortId, viewport.getRange, columns, sort, filter, groupBy = groupBy)
        }
        else
          viewPortContainer.change(ctx.session, msg.viewPortId, viewport.getRange, columns, sort, filter)

        logger.info(s"Setting columns to ${columns.map(_.name).mkString(",")} ")

        Some(VsMsg(ctx.requestId, ctx.session.sessionId, ctx.token, ctx.session.user,
          ChangeViewPortSuccess(newViewPort.id, columns.map(_.name).toArray, sort, msg.groupBy, msg.filterSpec)))

      case None =>
        Some(VsMsg(ctx.requestId, ctx.session.sessionId, ctx.token, ctx.session.user, ErrorResponse(s"Could not find vp ${msg.viewPortId} in session ${ctx.session}")))
    }

  }

  override def process(msg: CreateViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage] = {

    val table = tableContainer.getTable(msg.table.table)

    if(table == null)
      errorMsg(s"no table found for ${msg.table}")(ctx)
    else{

      val columns = if(msg.columns.size == 1 && msg.columns(0) == "*"){
        logger.info("[CreateViewPortRequest] Wildcard specified for columns, going to return all")
        table.getTableDef.columns.toList
      }
      else
        msg.columns.map(table.getTableDef.columnForName(_)).toList

      val sort = msg.sort
      val filter = msg.filterSpec

      val viewPort = if(msg.groupBy.isEmpty)
        viewPortContainer.create(ctx.session, ctx.queue, ctx.highPriorityQueue, table, msg.range, columns, sort, filter, NoGroupBy)
      else {

        val groupByColumns = msg.groupBy.filter(table.getTableDef.columnForName(_) != null).map(table.getTableDef.columnForName(_)).toList

        val aggregations   = List()//groupByColumns.map( col => {
//          if( col.dataType == DataType.DoubleDataType || col.dataType == DataType.LongDataType || col.dataType == DataType.IntegerDataType) Aggregation(col, AggregationType.Sum)
//          else viewport.Aggregation(col, AggregationType.Count)
//        })

        val groupBy = new GroupBy(groupByColumns, aggregations)

        viewPortContainer.create(ctx.session, ctx.queue, ctx.highPriorityQueue, table, msg.range, columns, sort, filter, groupBy)
      }

      vsMsg(CreateViewPortSuccess(viewPort.id, viewPort.table.name, msg.range, msg.columns, msg.sort, msg.groupBy, msg.filterSpec))(ctx)
    }

  }

  protected def errorMsg(s: String)(ctx: RequestContext): Option[ViewServerMessage] = {
     Some(VsMsg(ctx.requestId, ctx.session.sessionId, ctx.token, ctx.session.user, ErrorResponse(s)))
  }


  override def process(msg: ChangeViewPortRange)(ctx: RequestContext): Option[ViewServerMessage] = {

    Try(viewPortContainer.changeRange(ctx.session, ctx.queue, msg.viewPortId, ViewPortRange(msg.from, msg.to))) match {
      case Success(vp) =>
        vsMsg(ChangeViewPortRangeSuccess(vp.id, msg.from, msg.to))(ctx)
      case Failure(e) =>
        logger.error("Could not change VP range:", e)
        errorMsg("Could not change VP range:" + e.getMessage)(ctx)
    }
  }

  override def process(msg: SetSelectionRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.changeSelection(ctx.session, ctx.queue, msg.vpId, ViewPortSelectedIndices(msg.selection))) match{
      case Success(vp) =>
        vsMsg(SetSelectionSuccess(vp.id, vp.getSelection.map( tup => tup._2).toArray))(ctx)
      case Failure(e) =>
        logger.error("Could not change VP selection:", e.getMessage)
        errorMsg("Could not change VP selection:" + e.getMessage)(ctx)
    }
  }

  override def process(msg: GetViewPortVisualLinksRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.getViewPortVisualLinks(ctx.session, msg.vpId)) match {
      case Success(linksAndViewPorts) =>
        vsMsg(GetViewPortVisualLinksResponse(msg.vpId, linksAndViewPorts.map({ case(link, viewPort) => AvailableViewPortVisualLink(viewPort.id, link)})))(ctx)
      case Failure(e) =>
        logger.error("Could not load links for viewport:", e.getMessage)
        errorMsg("Could not load links for viewport" + e.getMessage)(ctx)
    }
  }

  override def process(msg: CreateVisualLinkRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.linkViewPorts(ctx.session, ctx.queue, msg.childVpId, msg.parentVpId, msg.childColumnName, msg.parentColumnName)) match {
      case Success(_) =>
        vsMsg(CreateVisualLinkSuccess(childVpId = msg.childVpId, parentVpId = msg.parentVpId, childColumnName = msg.childColumnName, parentColumnName = msg.parentColumnName))(ctx)
      case Failure(e) =>
        logger.error("Could not establish Visual Link:", e.getMessage)
        errorMsg("Could not establish Visual Link" + e.getMessage)(ctx)
    }
  }

  override def process(msg: OpenTreeNodeRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    viewPortContainer.openNode(msg.vpId, msg.treeKey)
    vsMsg(OpenTreeNodeSuccess(msg.vpId, msg.treeKey))(ctx)
  }

  override def process(msg: CloseTreeNodeRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    viewPortContainer.closeNode(msg.vpId, msg.treeKey)
    vsMsg(CloseTreeNodeSuccess(msg.vpId, msg.treeKey))(ctx)
  }
}
