package org.finos.vuu.core

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.AvailableViewPortVisualLink
import org.finos.vuu.api.TableVisibility.Public
import org.finos.vuu.core.table.{DataType, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.net.*
import org.finos.vuu.net.rpc.{RpcFunctionFailure, RpcFunctionSuccess}
import org.finos.vuu.provider.ProviderContainer
import org.finos.vuu.viewport.*

import scala.util.{Failure, Success, Try}

class CoreServerApiHandler(val viewPortContainer: ViewPortContainer,
                           val tableContainer: TableContainer,
                           val providers: ProviderContainer)(implicit timeProvider: Clock) extends ServerApi with StrictLogging {

  override def process(msg: ViewPortMenuCellRpcCall)(using ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.callRpcCell(msg.vpId, msg.rpcName, ctx.session, msg.rowKey, msg.field, msg.value)) match {
      case Success(action) => handleMenuRPCSuccess(action, msg, msg.vpId, msg.rpcName)
      case Failure(e) => handleMenuRPCFailure(e, msg, msg.vpId, msg.rpcName)
    }
  }

  override def process(msg: ViewPortMenuRowRpcCall)(using ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.callRpcRow(msg.vpId, msg.rpcName, ctx.session, msg.rowKey, msg.row)) match {
      case Success(action) => handleMenuRPCSuccess(action, msg, msg.vpId, msg.rpcName)
      case Failure(e) => handleMenuRPCFailure(e, msg, msg.vpId, msg.rpcName)
    }
  }

  override def process(msg: ViewPortMenuTableRpcCall)(using ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.callRpcTable(msg.vpId, msg.rpcName, ctx.session)) match {
      case Success(action) => handleMenuRPCSuccess(action, msg, msg.vpId, msg.rpcName)
      case Failure(e) => handleMenuRPCFailure(e, msg, msg.vpId, msg.rpcName)
    }
  }

  override def process(msg: ViewPortMenuSelectionRpcCall)(using ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.callRpcSelection(msg.vpId, msg.rpcName, ctx.session)) match {
      case Success(action) => handleMenuRPCSuccess(action, msg, msg.vpId, msg.rpcName)
      case Failure(e) => handleMenuRPCFailure(e, msg, msg.vpId, msg.rpcName)
    }
  }

  override def process(msg: RemoveViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.removeViewPort(msg.viewPortId, ctx.session)) match {
      case Success(_) =>
        logger.info(s"[API] Removed viewport ${msg.viewPortId} in session ${ctx.session.sessionId}")
        vsMsg(RemoveViewPortSuccess(msg.viewPortId))(ctx)
      case Failure(e) =>
        logger.error(s"[API] Failed to remove viewport ${msg.viewPortId} in session ${ctx.session.sessionId}", e)
        vsMsg(RemoveViewPortReject(msg.viewPortId))(ctx)
    }
  }

  override def process(msg: EnableViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.enableViewPort(msg.viewPortId, ctx.session)) match {
      case Success(_) =>
        logger.info(s"[API] Enabled viewport ${msg.viewPortId} in session ${ctx.session.sessionId}")
        vsMsg(EnableViewPortSuccess(msg.viewPortId))(ctx)
      case Failure(e) =>
        logger.error(s"[API] Failed to enable viewport ${msg.viewPortId} in session ${ctx.session.sessionId}", e)
        vsMsg(EnableViewPortReject(msg.viewPortId))(ctx)
    }
  }

  override def process(msg: DisableViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.disableViewPort(msg.viewPortId, ctx.session)) match {
      case Success(_) =>
        logger.info(s"[API] Disabled viewport ${msg.viewPortId} in session ${ctx.session.sessionId}")
        vsMsg(DisableViewPortSuccess(msg.viewPortId))(ctx)
      case Failure(e) =>
        logger.error(s"[API] Failed to disable viewport ${msg.viewPortId} in session ${ctx.session.sessionId}", e)
        vsMsg(DisableViewPortReject(msg.viewPortId))(ctx)
    }
  }

  override def process(msg: FreezeViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.freezeViewPort(msg.viewPortId, ctx.session)) match {
      case Success(_) =>
        logger.info(s"[API] Froze viewport ${msg.viewPortId} in session ${ctx.session.sessionId}")
        vsMsg(FreezeViewPortSuccess(msg.viewPortId))(ctx)
      case Failure(e) =>
        logger.error(s"[API] Failed to freeze viewport ${msg.viewPortId} in session ${ctx.session.sessionId}", e)
        vsMsg(FreezeViewPortReject(msg.viewPortId, s"Failed to process request ${ctx.requestId}"))(ctx)
    }
  }

  override def process(msg: UnfreezeViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.unfreezeViewPort(msg.viewPortId, ctx.session)) match {
      case Success(_) =>
        logger.info(s"[API] Unfroze viewport ${msg.viewPortId} in session ${ctx.session.sessionId}")
        vsMsg(UnfreezeViewPortSuccess(msg.viewPortId))(ctx)
      case Failure(e) =>
        logger.error(s"[API] Failed to unfreeze viewport ${msg.viewPortId} in session ${ctx.session.sessionId}", e)
        vsMsg(UnfreezeViewPortReject(msg.viewPortId, s"Failed to process request ${ctx.requestId}"))(ctx)
    }
  }

  override def process(msg: GetTableList)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(tableContainer.getDefinedTables) match {
      case Success(viewPortTables) =>
        logger.info(s"[API] Got table list for session ${ctx.session.sessionId}")
        vsMsg(GetTableListResponse(viewPortTables))(ctx)
      case Failure(e) =>
        logger.error(s"[API] Failed to get table list for session ${ctx.session.sessionId}", e)
        errorMsg(s"Failed to process request ${ctx.requestId}")(ctx)
    }
  }

  override def process(msg: RpcUpdate)(ctx: RequestContext): Option[ViewServerMessage] = {
    //TODO This is way too dangerous to leave enabled for now.
    vsMsg(RpcReject(msg.table, msg.key, "No longer supported"))(ctx)
  }

  override def process(msg: HeartBeatResponse)(ctx: RequestContext): Option[ViewServerMessage] = {
    logger.trace("HB [" + (timeProvider.now() - msg.ts) + "]")
    None
  }

  override def disconnect(session: ClientSessionId): Unit = {
    logger.trace(s"Disconnecting ${session.sessionId}")
    viewPortContainer.removeForSession(session)
    tableContainer.removeSessionTables(session)
  }

  override def process(msg: GetViewPortMenusRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.getViewPortMenu(msg.vpId, ctx.session)) match {
      case Success(viewPortMenu) =>
        logger.info(s"[API] Got menu for viewport ${msg.vpId} in session ${ctx.session.sessionId}")
        vsMsg(GetViewPortMenusResponse(msg.vpId, viewPortMenu))(ctx)
      case Failure(e) =>
        logger.error(s"[API] Failed to get menus for viewport ${msg.vpId} in session ${ctx.session.sessionId}", e)
        errorMsg(s"Failed to process request ${ctx.requestId}")(ctx)
    }
  }

  override def process(msg: GetTableMetaRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(processGetTableMetaRequest(msg)(ctx)) match {
      case Success(tableMetaResponse) =>
        logger.info(s"[API] Got metadata for table ${msg.table.table} in session ${ctx.session.sessionId}")
        vsMsg(tableMetaResponse)(ctx)
      case Failure(e) =>
        logger.error(s"[API] Failed to get metadata for table ${msg.table.table} in session ${ctx.session.sessionId}", e)
        errorMsg(s"Failed to process request ${ctx.requestId}")(ctx)
    }
  }

  private def processGetTableMetaRequest(msg: GetTableMetaRequest)(ctx: RequestContext): GetTableMetaResponse = {
    val table = tableContainer.getTable(msg.table.table)
    if (table != null && table.getTableDef.visibility == Public) {
      val viewPortDef = viewPortContainer.getViewPortDefinition(table)
      val columns = viewPortDef.columns.sortBy(_.index)
      val columnNames = columns.map(_.name)
      val dataTypes = columns.map(col => DataType.asString(col.dataType))
      GetTableMetaResponse(msg.table, columnNames, dataTypes, table.getTableDef.keyField)
    } else {
      throw new RuntimeException(s"Failed to find table ${msg.table.table} in module ${msg.table.module}")
    }
  }

  override def process(msg: ChangeViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(processChange(msg)(ctx)) match {
      case Success(viewport) =>
        logger.info(s"[API] Changed viewport ${msg.viewPortId} in session ${ctx.session.sessionId}. Filter: ${msg.filterSpec}. Sort: ${msg.sort}. GroupBy: ${msg.groupBy.mkString(",")}")
        vsMsg(ChangeViewPortSuccess(msg.viewPortId, msg.columns, msg.sort, msg.groupBy, msg.filterSpec, msg.aggregations))(ctx)
      case Failure(e) =>
        logger.error(s"[API] Failed to change viewport ${msg.viewPortId} in session ${ctx.session.sessionId}", e)
        vsMsg(ChangeViewPortReject(msg.viewPortId, s"Failed to process request ${ctx.requestId}"))(ctx)
    }
  }

  private def processChange(msg: ChangeViewPortRequest)(ctx: RequestContext): ViewPort = {

    val viewPort = viewPortContainer.getViewportInSession(msg.viewPortId, ctx.session)
    val table = viewPort.table.asTable

    val columns = if (msg.columns.length == 1 && msg.columns(0) == "*") {
      logger.trace("[API] Wildcard specified for columns, going to return all")
      table.getTableDef.getColumns.toList
    } else {
      validateColumns(table, msg.columns)
      msg.columns.map(table.getTableDef.columnForName(_)).toList
    }

    val vpColumns = ViewPortColumnCreator.create(table, msg.columns.toList)

    val sort = msg.sort
    val filter = msg.filterSpec
    val groupBy = msg.groupBy

    if (!groupBy.isEmpty) {

      val groupByColumns = msg.groupBy
        .filter(vpColumns.columnExists)
        .map(vpColumns.getColumnForName(_).get).toList

      val aggregations = msg.aggregations
        .filter(agg => vpColumns.columnExists(agg.column))
        .map(agg => Aggregation(vpColumns.getColumnForName(agg.column).get, agg.aggType.toShort)).toList

      val groupBy = new GroupBy(groupByColumns, aggregations)

      viewPortContainer.change(ctx.requestId, ctx.session, msg.viewPortId, viewPort.getRange, vpColumns, sort, filter, groupBy = groupBy)
    } else {

      viewPortContainer.change(ctx.requestId, ctx.session, msg.viewPortId, viewPort.getRange, vpColumns, sort, filter)
    }
  }

  private def validateColumns(table: RowSource, columns: Array[String]): Unit = {
    val invalidColumns = columns
      .filter(!_.contains(":")) // remove calculated columns
      .filter(name => !table.asTable.getTableDef.columnExists(name))
    if (invalidColumns.nonEmpty) {
      throw new RuntimeException(s"Invalid columns specified in viewport request: [${invalidColumns.mkString(",")}]")
    }
  }

  override def process(msg: CreateViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(processCreate(msg)(ctx)) match {
      case Success(viewport) =>
        logger.info(s"[API] Created viewport ${viewport.id} in session ${ctx.session.sessionId}. Filter: ${msg.filterSpec}. Sort: ${msg.sort}. GroupBy: ${msg.groupBy.mkString(",")}")
        vsMsg(CreateViewPortSuccess(viewport.id, msg.table.table, msg.range, msg.columns,
          msg.sort, msg.groupBy, msg.filterSpec, msg.aggregations))(ctx)
      case Failure(e) =>
        logger.error(s"[API] Failed to create viewport on table ${msg.table} in session ${ctx.session.sessionId}", e)
        vsMsg(CreateViewPortReject(msg.table, s"Failed to process request ${ctx.requestId}"))(ctx)
    }
  }

  private def processCreate(msg: CreateViewPortRequest)(ctx: RequestContext): ViewPort = {
    val table = tableContainer.getTable(msg.table.table)
    if (table == null || table.getTableDef.visibility != Public) {
      throw new RuntimeException(s"No table found with name ${msg.table}")
    } else {

      val columns = if (msg.columns.length == 1 && msg.columns(0) == "*") {
        logger.trace("[API] Wildcard specified for columns, going to return all")
        table.getTableDef.getColumns.toList
      }
      else {
        validateColumns(table, msg.columns)
        msg.columns.map(table.getTableDef.columnForName(_)).toList
      }

      val vpColumns = ViewPortColumnCreator.create(table, msg.columns.toList)

      val sort = msg.sort
      val filter = msg.filterSpec

      if (msg.groupBy.isEmpty) {

        viewPortContainer.create(ctx.requestId, ctx.user, ctx.session, ctx.queue, table, msg.range, vpColumns, sort, filter, NoGroupBy)
      } else {

        val groupByColumns = msg.groupBy.filter(vpColumns.getColumnForName(_).get != null).flatMap(vpColumns.getColumnForName).toList
        val aggs = msg.aggregations.map(a => Aggregation(vpColumns.getColumnForName(a.column).get, a.aggType.toShort)).toList
        val groupBy = new GroupBy(groupByColumns, aggs)
        viewPortContainer.create(ctx.requestId, ctx.user, ctx.session, ctx.queue, table, msg.range, vpColumns, sort, filter, groupBy)
      }
    }
  }

  override def process(msg: ChangeViewPortRange)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.changeRange(ctx.session, msg.viewPortId, ViewPortRange(msg.from, msg.to))) match {
      case Success(vp) =>
        logger.info(s"[API] Changed range in viewport ${msg.viewPortId} in session ${ctx.session.sessionId} to [${msg.from} -> ${msg.to}]")
        vsMsg(ChangeViewPortRangeSuccess(msg.viewPortId, msg.from, msg.to))(ctx)
      case Failure(e) =>
        logger.error(s"[API] Failed to change range on viewport ${msg.viewPortId} in session ${ctx.session.sessionId} to [${msg.from} -> ${msg.to}]", e)
        errorMsg(s"Failed to process request ${ctx.requestId}")(ctx)
    }
  }

  override def process(msg: SelectRowRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.selectRow(ctx.session, msg.vpId, msg.rowKey, msg.preserveExistingSelection)) match {
      case Success(vp) =>
        logger.info(s"[API] Selected row with key ${msg.rowKey} in viewport ${msg.vpId} in session ${ctx.session.sessionId}. Preserve: ${msg.preserveExistingSelection}")
        vsMsg(SelectRowSuccess(msg.vpId, vp.getSelection.size))(ctx)
      case Failure(e) =>
        logger.error(s"[API] Failed to select row with key ${msg.rowKey} in viewport ${msg.vpId} in session ${ctx.session.sessionId}. Preserve: ${msg.preserveExistingSelection}", e)
        vsMsg(SelectRowReject(msg.vpId, s"Failed to process request ${ctx.requestId}"))(ctx)
    }
  }

  override def process(msg: DeselectRowRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.deselectRow(ctx.session, msg.vpId, msg.rowKey, msg.preserveExistingSelection)) match {
      case Success(vp) =>
        logger.info(s"[API] Deselected row with key ${msg.rowKey} in viewport ${msg.vpId} in session ${ctx.session.sessionId}. Preserve: ${msg.preserveExistingSelection}")
        vsMsg(DeselectRowSuccess(msg.vpId, vp.getSelection.size))(ctx)
      case Failure(e) =>
        logger.error(s"[API] Failed to deselect row with key ${msg.rowKey} in viewport ${msg.vpId} in session ${ctx.session.sessionId}. Preserve: ${msg.preserveExistingSelection}", e)
        vsMsg(DeselectRowReject(msg.vpId, s"Failed to process request ${ctx.requestId}"))(ctx)
    }
  }

  override def process(msg: SelectRowRangeRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.selectRowRange(ctx.session, msg.vpId, msg.fromRowKey, msg.toRowKey, msg.preserveExistingSelection)) match {
      case Success(vp) =>
        logger.info(s"[API] Selected range [${msg.fromRowKey} -> ${msg.toRowKey}] in viewport ${msg.vpId} in session ${ctx.session.sessionId}. Preserve: ${msg.preserveExistingSelection}")
        vsMsg(SelectRowRangeSuccess(vp.id, vp.getSelection.size))(ctx)
      case Failure(e) =>
        logger.error(s"[API] Failed to select range [${msg.fromRowKey} -> ${msg.toRowKey}] in viewport ${msg.vpId} in session ${ctx.session.sessionId}. Preserve: ${msg.preserveExistingSelection}", e)
        vsMsg(SelectRowRangeReject(msg.vpId, s"Failed to process request ${ctx.requestId}"))(ctx)
    }
  }

  override def process(msg: SelectAllRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.selectAll(ctx.session, msg.vpId)) match {
      case Success(vp) =>
        logger.info(s"[API] Selected all rows in viewport ${msg.vpId} in session ${ctx.session.sessionId}")
        vsMsg(SelectAllSuccess(msg.vpId, vp.getSelection.size))(ctx)
      case Failure(e) =>
        logger.error(s"[API] Failed to select all rows in viewport ${msg.vpId} in session ${ctx.session.sessionId}", e)
        vsMsg(SelectAllReject(msg.vpId, s"Failed to process request ${ctx.requestId}"))(ctx)
    }
  }

  override def process(msg: DeselectAllRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.deselectAll(ctx.session, msg.vpId)) match {
      case Success(vp) =>
        logger.info(s"[API] Deselected all rows in viewport ${msg.vpId} in session ${ctx.session.sessionId}")
        vsMsg(DeselectAllSuccess(vp.id))(ctx)
      case Failure(e) =>
        logger.error(s"[API] Failed to deselect all rows in viewport ${msg.vpId} in session ${ctx.session.sessionId}", e)
        vsMsg(DeselectAllReject(msg.vpId, s"Failed to process request ${ctx.requestId}"))(ctx)
    }
  }

  override def process(msg: GetViewPortVisualLinksRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.getViewPortVisualLinks(ctx.session, msg.vpId)) match {
      case Success(linksAndViewPorts) =>
        logger.info(s"[API] Got visual links in viewport ${msg.vpId} in session ${ctx.session.sessionId}")
        vsMsg(GetViewPortVisualLinksResponse(msg.vpId, linksAndViewPorts.map({ case (link, viewPort) => AvailableViewPortVisualLink(viewPort.id, link) })))(ctx)
      case Failure(e) =>
        logger.error(s"[API] Failed to get visual links in viewport ${msg.vpId} in session ${ctx.session.sessionId}", e)
        errorMsg(s"Failed to process request ${ctx.requestId}")(ctx)
    }
  }

  override def process(msg: CreateVisualLinkRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.linkViewPorts(ctx.session, ctx.queue, msg.childVpId, msg.parentVpId, msg.childColumnName, msg.parentColumnName)) match {
      case Success(_) =>
        logger.info(s"[API] Created visual link between child [${msg.childVpId}(${msg.childColumnName})] and parent [${msg.parentVpId}(${msg.parentColumnName})] in session ${ctx.session.sessionId}")
        vsMsg(CreateVisualLinkSuccess(childVpId = msg.childVpId, parentVpId = msg.parentVpId, childColumnName = msg.childColumnName, parentColumnName = msg.parentColumnName))(ctx)
      case Failure(e) =>
        logger.error(s"[API] Failed to create visual link between child [${msg.childVpId}(${msg.childColumnName})] and parent [${msg.parentVpId}(${msg.parentColumnName})] in session ${ctx.session.sessionId}", e)
        errorMsg(s"Failed to process request ${ctx.requestId}")(ctx)
    }
  }

  override def process(msg: RemoveVisualLinkRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.unlinkViewPorts(ctx.session, ctx.queue, msg.childVpId)) match {
      case Success(_) =>
        logger.info(s"[API] Removed visual link from child viewport ${msg.childVpId} in session ${ctx.session.sessionId}")
        vsMsg(RemoveVisualLinkSuccess(childVpId = msg.childVpId))(ctx)
      case Failure(e) =>
        logger.error(s"[API] Failed to remove visual link from child viewport ${msg.childVpId} in session ${ctx.session.sessionId}", e)
        errorMsg(s"Failed to process request ${ctx.requestId}")(ctx)
    }
  }

  override def process(msg: OpenTreeNodeRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.openNode(ctx.session, msg.vpId, msg.treeKey)) match {
      case Success(value) =>
        logger.info(s"[API] Opened tree node with key ${msg.treeKey} in viewport ${msg.vpId} in session ${ctx.session.sessionId}")
        vsMsg(OpenTreeNodeSuccess(msg.vpId, msg.treeKey))(ctx)
      case Failure(e) =>
        logger.error(s"[API] Failed to open tree node with key ${msg.treeKey} in viewport ${msg.vpId} in session ${ctx.session.sessionId}", e)
        vsMsg(OpenTreeNodeReject(msg.vpId, s"Failed to process request ${ctx.requestId}"))(ctx)
    }
  }

  override def process(msg: CloseTreeNodeRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.closeNode(ctx.session, msg.vpId, msg.treeKey)) match {
      case Success(value) =>
        logger.info(s"[API] Closed tree node with key ${msg.treeKey} in viewport ${msg.vpId} in session ${ctx.session.sessionId}")
        vsMsg(CloseTreeNodeSuccess(msg.vpId, msg.treeKey))(ctx)
      case Failure(e) =>
        logger.error(s"[API] Failed to close tree node with key ${msg.treeKey} in viewport ${msg.vpId} in session ${ctx.session.sessionId}", e)
        vsMsg(CloseTreeNodeReject(msg.vpId, s"Failed to process request ${ctx.requestId}"))(ctx)
    }
  }

  override def process(msg: RpcRequest)(ctx: RequestContext): Option[ViewServerMessage] =
    msg.context match {
      case context: ViewPortContext => handleViewPortRpcRequest(msg, context.viewPortId, ctx)
      case context =>
        logger.error(s"[API] Invalid context on request ${ctx.requestId}. Context: $context")
        vsMsg(createErrorRpcResponse(msg, s"Failed to process request ${ctx.requestId}"))(ctx)
    }

  private def handleViewPortRpcRequest(msg: RpcRequest, viewPortId: String, ctx: RequestContext) = {
    val response = Try(viewPortContainer.handleRpcRequest(viewPortId, msg.rpcName, msg.params)(ctx)) match {
      case Success(functionResult) =>
        functionResult match {
          case RpcFunctionSuccess(data) =>
            logger.info(s"[API] Called RPC ${msg.rpcName} in viewport $viewPortId in session ${ctx.session.sessionId} with params ${msg.params}")
            RpcResponseNew(rpcName = msg.rpcName, result = RpcSuccessResult(data), NoneAction())
          case RpcFunctionFailure(errorCode, error, exception) =>
            logger.error(s"[API] Failed to call RPC ${msg.rpcName} in viewport $viewPortId in session ${ctx.session.sessionId} with params ${msg.params}", Exception(error, exception))
            createErrorRpcResponse(msg, error)
        }
      case Failure(e) =>
        logger.error(s"[API] Failed to handle RPC Request $msg in viewport $viewPortId in session ${ctx.session.sessionId}", e)
        createErrorRpcResponse(msg, s"Failed to process request ${ctx.requestId}")
    }
    vsMsg(response)(ctx)
  }

  private def createErrorRpcResponse(msg: RpcRequest, errorMessage: String) = {
    RpcResponseNew(
      rpcName = msg.rpcName,
      result = RpcErrorResult(errorMessage),
      action = ShowNotificationAction(NotificationType.Error, s"Failed to process ${msg.rpcName} request", errorMessage))
  }

  private def handleMenuRPCSuccess(action: ViewPortAction, msg: AnyRef,
                                   vpId: String, rpcName: String)(using ctx: RequestContext): Option[ViewServerMessage] = {
    logger.info(s"[API] Processed $msg in session ${ctx.session.sessionId}")
    vsMsg(ViewPortMenuRpcResponse(vpId, rpcName, action))(ctx)
  }

  private def handleMenuRPCFailure(e: Throwable, msg: AnyRef,
                                   vpId: String, rpcName: String)(using ctx: RequestContext): Option[ViewServerMessage] = {
    logger.error(s"[API] Failed to process $msg in session ${ctx.session.sessionId}", e)
    vsMsg(ViewPortMenuRpcReject(vpId, rpcName, s"Failed to process request ${ctx.requestId}"))(ctx)
  }

  private def vsMsg(body: MessageBody)(ctx: RequestContext): Option[JsonViewServerMessage] = {
    Some(VsMsg(ctx.requestId, ctx.session.sessionId, body))
  }

  private def errorMsg(s: String)(ctx: RequestContext): Option[ViewServerMessage] = {
    Some(VsMsg(ctx.requestId, ctx.session.sessionId, ErrorResponse(s)))
  }

}