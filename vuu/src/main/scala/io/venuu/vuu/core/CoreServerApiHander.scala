/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 16/11/2015.

  */
package io.venuu.vuu.core

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.core.table.{DataType, TableContainer}
import io.venuu.vuu.net._
import io.venuu.vuu.provider.{ProviderContainer, RpcProvider}
import io.venuu.vuu.viewport
import io.venuu.vuu.viewport._

import scala.util.{Failure, Success, Try}

//class CoreServerApiHander(viewPortContainer: ViewPortContainer, tableContainer: TableContainer, providers: ProviderContainer)(implicit timeProvider: TimeProvider) extends ServerApi with StrictLogging{
class CoreServerApiHander(viewPortContainer: ViewPortContainer,
                    tableContainer: TableContainer,
                    providers: ProviderContainer)(implicit timeProvider: Clock) extends ServerApi with StrictLogging{

  def vsMsg(body: MessageBody)(ctx: RequestContext): Option[JsonViewServerMessage] = {
    Some(VsMsg(ctx.requestId, ctx.session.sessionId, ctx.token, ctx.session.user, body))
  }

  override def process(msg: GetTableList)(ctx: RequestContext): Option[ViewServerMessage] = {
    vsMsg(GetTableListResponse(tableContainer.getTableNames()))(ctx)
  }

  override def process(msg: RpcUpdate)(ctx: RequestContext): Option[ViewServerMessage] = {
    val table = tableContainer.getTable(msg.table)

    if(table == null)
      vsMsg(RpcReject(msg.table, msg.key, s"could not find table ${msg.table} to update in table container"))(ctx)
    else{
      Try(providers.getProviderForTable(msg.table).get.asInstanceOf[RpcProvider].tick(msg.key, msg.data)) match{
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
    logger.info("Got hearbeat, diff:" + (timeProvider.now() - msg.ts) )
    None
  }

  override def disconnect(session: ClientSessionId): Unit = {
    logger.info("On Disconnect")
    viewPortContainer.removeForSession(session)
    tableContainer.removeSessionTables(session)
  }

  override def process(msg: GetTableMetaRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    if(msg.table == null)
      errorMsg(s"Table ${msg.table} not found in container")(ctx)
    else{
      val table = tableContainer.getTable(msg.table)
      val columnNames = table.getTableDef.columns.map(_.name)
      val dataTypes = table.getTableDef.columns.map(col => DataType.asString(col.dataType))
      vsMsg(GetTableMetaResponse(table.name, columnNames, dataTypes, table.getTableDef.keyField))(ctx)
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

        //TODO: CJS add support for changing flat viewport to GroupBy Viewport

        val sort = msg.sort
        val filter = msg.filterSpec
        val groupBy = msg.groupBy

        val newViewPort = if(!groupBy.isEmpty){

          val groupByColumns = msg.groupBy.map(table.getTableDef.columnForName(_)).toList

          val groupBy = new GroupBy(groupByColumns, List())

          viewPortContainer.change(ctx.session, msg.viewPortId, viewport.getRange(), columns, sort, filter, groupBy = groupBy)
        }
        else
          viewPortContainer.change(ctx.session, msg.viewPortId, viewport.getRange(), columns, sort, filter)

        logger.info(s"Setting columns to ${columns.map(_.name).mkString(",")} ")

        Some(VsMsg(ctx.requestId, ctx.session.sessionId, ctx.token, ctx.session.user,
          ChangeViewPortSuccess(newViewPort.id, columns.map(_.name).toArray, sort, msg.groupBy, msg.filterSpec)))

      case None =>
        Some(VsMsg(ctx.requestId, ctx.session.sessionId, ctx.token, ctx.session.user, ErrorResponse(s"Could not find vp ${msg.viewPortId} in session ${ctx.session}")))
    }

  }

  override def process(msg: CreateViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage] = {

    val table = tableContainer.getTable(msg.table)

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

        val groupByColumns = msg.groupBy.map(table.getTableDef.columnForName(_)).toList

        val aggregations   = groupByColumns.map( col => {
          if( col.dataType == DataType.DoubleDataType || col.dataType == DataType.LongDataType || col.dataType == DataType.IntegerDataType) Aggregation(col, AggregationType.Sum)
          else viewport.Aggregation(col, AggregationType.Count)
        })

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

    logger.info("Request to change vp range:" + msg)

    Try(viewPortContainer.changeRange(ctx.session, ctx.queue, msg.viewPortId, ViewPortRange(msg.from, msg.to))) match {
      case Success(vp) =>
        vsMsg(ChangeViewPortRangeSuccess(vp.id, msg.from, msg.to))(ctx)
      case Failure(e) =>
        logger.error("Could not change VP range:", e.getMessage)
        errorMsg("Could not change VP range:" + e.getMessage)(ctx)
    }
  }

  override def process(msg: OpenTreeNodeRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    viewPortContainer.openNode(msg.vpId, msg.treeKey)
    vsMsg(ChangeViewPortRangeSuccess(msg.vpId, -1,-1))(ctx)
  }

  override def process(msg: CloseTreeNodeRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    viewPortContainer.closeNode(msg.vpId, msg.treeKey)
    vsMsg(ChangeViewPortRangeSuccess(msg.vpId, -1,-1))(ctx)
  }
}
