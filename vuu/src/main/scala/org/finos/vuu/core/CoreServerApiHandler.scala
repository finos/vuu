package org.finos.vuu.core

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.AvailableViewPortVisualLink
import org.finos.vuu.core.table.{DataType, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.net._
import org.finos.vuu.net.rpc.{RpcFunctionFailure, RpcFunctionSuccess}
import org.finos.vuu.provider.{ProviderContainer, RpcProvider}
import org.finos.vuu.viewport._

import scala.util.{Failure, Success, Try}

class CoreServerApiHandler(val viewPortContainer: ViewPortContainer,
                           val tableContainer: TableContainer,
                           val providers: ProviderContainer)(implicit timeProvider: Clock) extends ServerApi with StrictLogging {


  override def process(msg: ViewPortRpcCall)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.callRpcService(msg.vpId, msg.rpcName, msg.params, msg.namedParams, ctx.session)(ctx)) match {
      case Success(action) =>
        logger.debug("Processed VP RPC call " + msg)
        vsMsg(ViewPortRpcResponse(msg.vpId, msg.rpcName, action))(ctx)
      case Failure(e) =>
        logger.warn("Failed to process VP RPC call", e)
        vsMsg(ViewPortMenuRpcReject(msg.vpId, msg.rpcName, e.getMessage))(ctx)
    }
  }

  override def process(msg: ViewPortMenuCellRpcCall)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.callRpcCell(msg.vpId, msg.rpcName, ctx.session, msg.rowKey, msg.field, msg.value)) match {
      case Success(action) =>
        logger.debug("Processed VP Menu Cell RPC call" + msg)
        vsMsg(ViewPortMenuRpcResponse(msg.vpId, msg.rpcName, action))(ctx)
      case Failure(e) =>
        logger.warn("Failed to process VP Menu Cell RPC call", e)
        vsMsg(ViewPortMenuRpcReject(msg.vpId, msg.rpcName, e.getMessage))(ctx)
    }
  }

  override def process(msg: ViewPortMenuRowRpcCall)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.callRpcRow(msg.vpId, msg.rpcName, ctx.session, msg.rowKey, msg.row)) match {
      case Success(action) =>
        logger.debug("Processed VP Menu Row RPC call" + msg)
        vsMsg(ViewPortMenuRpcResponse(msg.vpId, msg.rpcName, action))(ctx)
      case Failure(e) =>
        logger.warn("Failed to process VP Menu Row RPC call", e)
        vsMsg(ViewPortMenuRpcReject(msg.vpId, msg.rpcName, e.getMessage))(ctx)
    }
  }

  override def process(msg: ViewPortMenuTableRpcCall)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.callRpcTable(msg.vpId, msg.rpcName, ctx.session)) match {
      case Success(action) =>
        logger.debug("Processed VP Menu Table RPC call" + msg)
        vsMsg(ViewPortMenuRpcResponse(msg.vpId, msg.rpcName, action))(ctx)
      case Failure(e) =>
        logger.warn("Failed to process VP Menu Table RPC call", e)
        vsMsg(ViewPortMenuRpcReject(msg.vpId, msg.rpcName, e.getMessage))(ctx)
    }
  }

  override def process(msg: ViewPortMenuSelectionRpcCall)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.callRpcSelection(msg.vpId, msg.rpcName, ctx.session)) match {
      case Success(action) =>
        logger.debug("Processed VP Menu Selection RPC call" + msg)
        vsMsg(ViewPortMenuRpcResponse(msg.vpId, msg.rpcName, action))(ctx)
      case Failure(e) =>
        logger.warn("Failed to process VP Menu Selection RPC call", e)
        vsMsg(ViewPortMenuRpcReject(msg.vpId, msg.rpcName, e.getMessage))(ctx)
    }
  }

  override def process(msg: ViewPortEditCellRpcCall)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.callRpcEditCell(msg.vpId, msg.rowKey, msg.field, msg.value, ctx.session)) match {
      case Success(action) =>
        logger.debug("Processed VP Edit Cell RPC call" + msg)
        vsMsg(ViewPortMenuRpcResponse(msg.vpId, "VP_EDIT_CELL_RPC", action))(ctx)
      case Failure(e) =>
        logger.warn("Failed to process VP Edit Cell RPC call", e)
        vsMsg(ViewPortMenuRpcReject(msg.vpId, "VP_EDIT_CELL_RPC", e.getMessage))(ctx)
    }
  }

  override def process(msg: ViewPortEditRowRpcCall)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.callRpcEditRow(msg.vpId, msg.rowKey, msg.data, ctx.session)) match {
      case Success(action) =>
        logger.debug("Processed VP Edit Row RPC call" + msg)
        vsMsg(ViewPortEditRpcResponse(msg.vpId, "VP_EDIT_ROW_RPC", action))(ctx)
      case Failure(e) =>
        logger.warn("Failed to process VP Edit Row RPC call", e)
        vsMsg(ViewPortMenuRpcReject(msg.vpId, "VP_EDIT_ROW_RPC", e.getMessage))(ctx)
    }
  }

  override def process(msg: ViewPortEditSubmitFormRpcCall)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.callRpcEditFormSubmit(msg.vpId, ctx.session)) match {
      case Success(action) =>
        logger.debug("Processed VP Edit Submit From RPC call" + msg)
        vsMsg(ViewPortEditRpcResponse(msg.vpId, "VP_EDIT_SUBMIT_FORM_RPC", action))(ctx)
      case Failure(e) =>
        logger.warn("Failed to process VP Edit Submit From RPC call", e)
        vsMsg(ViewPortEditRpcReject(msg.vpId, "VP_EDIT_SUBMIT_FORM_RPC", e.getMessage))(ctx)
    }
  }

  override def process(msg: ViewPortDeleteCellRpcCall)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.callRpcEditDeleteCell(msg.vpId, msg.rowKey, msg.field, ctx.session)) match {
      case Success(action) =>
        logger.debug("Processed VP Edit Delete Cell RPC call" + msg)
        vsMsg(ViewPortEditRpcResponse(msg.vpId, "VP_EDIT_DELETE_CELL_RPC", action))(ctx)
      case Failure(e) =>
        logger.warn("Failed to process VP Edit Delete Cell RPC call", e)
        vsMsg(ViewPortEditRpcReject(msg.vpId, "VP_EDIT_DELETE_CELL_RPC", e.getMessage))(ctx)
    }
  }

  override def process(msg: ViewPortDeleteRowRpcCall)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.callRpcEditDeleteRow(msg.vpId, msg.rowKey, ctx.session)) match {
      case Success(action) =>
        logger.debug("Processed VP Edit Delete Row RPC call" + msg)
        vsMsg(ViewPortEditRpcResponse(msg.vpId, "VP_EDIT_DELETE_ROW_RPC", action))(ctx)
      case Failure(e) =>
        logger.warn("Failed to process VP Edit Delete Row RPC call", e)
        vsMsg(ViewPortEditRpcReject(msg.vpId, "VP_EDIT_DELETE_ROW_RPC", e.getMessage))(ctx)
    }
  }

  override def process(msg: ViewPortAddRowRpcCall)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.callRpcAddRow(msg.vpId, msg.rowKey, msg.data, ctx.session)) match {
      case Success(action) =>
        logger.debug("Processed VP Edit Add Row RPC call" + msg)
        vsMsg(ViewPortEditRpcResponse(msg.vpId, "VP_EDIT_ADD_ROW_RPC", action))(ctx)
      case Failure(e) =>
        logger.warn("Failed to process VP Edit Add Row RPC call", e)
        vsMsg(ViewPortEditRpcReject(msg.vpId, "VP_EDIT_ADD_ROW_RPC", e.getMessage))(ctx)
    }
  }

  override def process(msg: RemoveViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.removeViewPort(msg.viewPortId)) match {
      case Success(_) =>
        logger.debug("View port removed")
        vsMsg(RemoveViewPortSuccess(msg.viewPortId))(ctx)
      case Failure(e) =>
        logger.warn("Failed to remove viewport", e)
        vsMsg(RemoveViewPortReject(msg.viewPortId))(ctx)
    }
  }

  override def process(msg: EnableViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.enableViewPort(msg.viewPortId)) match {
      case Success(_) =>
        logger.debug("View port enabled")
        vsMsg(EnableViewPortSuccess(msg.viewPortId))(ctx)
      case Failure(e) =>
        logger.warn("Failed to enable viewport", e)
        vsMsg(RemoveViewPortReject(msg.viewPortId))(ctx)
    }
  }

  override def process(msg: DisableViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.disableViewPort(msg.viewPortId)) match {
      case Success(_) =>
        logger.debug("View port disabled")
        vsMsg(DisableViewPortSuccess(msg.viewPortId))(ctx)
      case Failure(e) =>
        logger.warn("Failed to disable viewport", e)
        vsMsg(DisableViewPortReject(msg.viewPortId))(ctx)
    }
  }

  override def process(msg: FreezeViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.freezeViewPort(msg.viewPortId)) match {
      case Success(_) =>
        logger.debug("View port froze")
        vsMsg(FreezeViewPortSuccess(msg.viewPortId))(ctx)
      case Failure(e) =>
        logger.warn("Failed to freeze viewport", e)
        vsMsg(FreezeViewPortReject(msg.viewPortId, e.toString))(ctx)
    }
  }

  override def process(msg: UnfreezeViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.unfreezeViewPort(msg.viewPortId)) match {
      case Success(_) =>
        logger.debug("View port unfroze")
        vsMsg(UnfreezeViewPortSuccess(msg.viewPortId))(ctx)
      case Failure(e) =>
        logger.warn("Failed to unfreeze viewport", e)
        vsMsg(UnfreezeViewPortReject(msg.viewPortId, e.toString))(ctx)
    }
  }

  def vsMsg(body: MessageBody)(ctx: RequestContext): Option[JsonViewServerMessage] = {
    Some(VsMsg(ctx.requestId, ctx.session.sessionId, ctx.token, ctx.session.user, body))
  }

  override def process(msg: GetTableList)(ctx: RequestContext): Option[ViewServerMessage] = {
    vsMsg(GetTableListResponse(tableContainer.getDefinedTables))(ctx)
  }

  override def process(msg: RpcUpdate)(ctx: RequestContext): Option[ViewServerMessage] = {
    val table = tableContainer.getTable(msg.table.table)

    if (table == null)
      vsMsg(RpcReject(msg.table, msg.key, s"could not find table ${msg.table} to update in table container"))(ctx)
    else {
      Try(providers.getProviderForTable(msg.table.table).get.asInstanceOf[RpcProvider].tick(msg.key, msg.data)) match {
        case Success(_) =>
          logger.debug(s"Rpc update success ${msg.table} ${msg.key}")
          vsMsg(RpcSuccess(msg.table, msg.key))(ctx)
        case Failure(e) =>
          logger.error(s"Rpc update reject ${msg.table} ${msg.key}", e)
          vsMsg(RpcReject(msg.table, msg.key, e.toString))(ctx)
      }
    }
  }

  override def process(msg: HeartBeatResponse)(ctx: RequestContext): Option[ViewServerMessage] = {
    logger.trace("HB [" + (timeProvider.now() - msg.ts) + "]")
    None
  }

  override def disconnect(session: ClientSessionId): Unit = {
    logger.trace("On Disconnect")
    viewPortContainer.removeForSession(session)
    tableContainer.removeSessionTables(session)
  }


  override def process(msg: GetViewPortMenusRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    if (msg.vpId == null || msg.vpId == "") {
      errorMsg(s"VpId is empty")(ctx)
    } else {
      viewPortContainer.get(ctx.session, msg.vpId) match {
        case Some(vp: ViewPort) =>
          vsMsg(GetViewPortMenusResponse(msg.vpId, vp.getStructure.viewPortDef.service.menuItems()))(ctx)
        case None =>
          errorMsg(s"Viewport not found")(ctx)
      }
    }
  }

  override def process(msg: GetTableMetaRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    if (msg.table.table == null || msg.table.module == null)
      errorMsg(s"No such table found with name ${msg.table.table} in module ${msg.table.module}. Table name and module should not be null")(ctx)
    else {
      val table = tableContainer.getTable(msg.table.table) //todo need to check module? what if modules with same table name

      if (table == null)
        errorMsg(s"No such table found with name ${msg.table.table} in module ${msg.table.module}")(ctx)
      else {

        val viewPortDef = viewPortContainer.getViewPortDefinition(table)
        val columns = viewPortDef.columns.sortBy(_.index)
        val columnNames = columns.map(_.name)
        val dataTypes = columns.map(col => DataType.asString(col.dataType))
        vsMsg(GetTableMetaResponse(msg.table, columnNames, dataTypes, table.getTableDef.keyField))(ctx)
      }
    }
  }


  override def process(msg: ChangeViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage] = {

    viewPortContainer.get(ctx.session, msg.viewPortId) match {
      case Some(viewport) =>

        val table = viewport.table.asTable

        val columns = if (msg.columns.length == 1 && msg.columns(0) == "*") {
          logger.trace("[ChangeViewPortRequest] Wildcard specified for columns, going to return all")
          table.getTableDef.columns.toList
        }
        else {
          validateColumns(table, msg.columns)

          msg.columns.map(table.getTableDef.columnForName(_)).toList
        }

        val vpColumns = ViewPortColumnCreator.create(table, msg.columns.toList)

        val sort = msg.sort
        val filter = msg.filterSpec
        val groupBy = msg.groupBy

        val newViewPort = if (!groupBy.isEmpty) {

          val groupByColumns = msg.groupBy
            .filter(vpColumns.columnExists)
            .map(vpColumns.getColumnForName(_).get).toList

          val aggregations = msg.aggregations
            .filter(agg => vpColumns.columnExists(agg.column))
            .map(agg => Aggregation(vpColumns.getColumnForName(agg.column).get, agg.aggType.toShort)).toList

          val groupBy = new GroupBy(groupByColumns, aggregations)

          viewPortContainer.change(ctx.requestId, ctx.session, msg.viewPortId, viewport.getRange, vpColumns, sort, filter, groupBy = groupBy)
        }
        else
          viewPortContainer.change(ctx.requestId, ctx.session, msg.viewPortId, viewport.getRange, vpColumns, sort, filter)

        //logger.info(s"Setting columns to ${columns.map(_.name).mkString(",")} ")

        Some(VsMsg(ctx.requestId, ctx.session.sessionId, ctx.token, ctx.session.user,
          ChangeViewPortSuccess(newViewPort.id, viewport.getColumns.getColumns().map(_.name).toArray, sort, msg.groupBy, msg.filterSpec, msg.aggregations)))

      case None =>
        Some(VsMsg(ctx.requestId, ctx.session.sessionId, ctx.token, ctx.session.user, ErrorResponse(s"Could not find vp ${msg.viewPortId} in session ${ctx.session}")))
    }

  }

  def validateColumns(table: RowSource, columns: Array[String]): Unit = {
    val invalidColumns = columns
      .filter(!_.contains(":")) // remove calculated columns
      .filter(name => !table.asTable.getTableDef.columns.map(_.name).contains(name))
    if (invalidColumns.nonEmpty) {
      logger.error("Invalid columns specified in viewport request:" + invalidColumns.mkString(","))
      throw new Exception("Invalid columns specified in viewport request")
    }
  }

  override def process(msg: CreateViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage] = {

    val table = tableContainer.getTable(msg.table.table)

    if (table == null)
      errorMsg(s"no table found for ${msg.table}")(ctx)
    else {

      val columns = if (msg.columns.length == 1 && msg.columns(0) == "*") {
        logger.trace("[CreateViewPortRequest] Wildcard specified for columns, going to return all")
        table.getTableDef.columns.toList
      }
      else {

        validateColumns(table, msg.columns)

        msg.columns.map(table.getTableDef.columnForName(_)).toList
      }

      val vpColumns = ViewPortColumnCreator.create(table, msg.columns.toList)

      val sort = msg.sort
      val filter = msg.filterSpec

      val viewPort = if (msg.groupBy.isEmpty)
        viewPortContainer.create(ctx.requestId, ctx.session, ctx.queue, table, msg.range, vpColumns, sort, filter, NoGroupBy)
      else {

        val groupByColumns = msg.groupBy.filter(vpColumns.getColumnForName(_).get != null).flatMap(vpColumns.getColumnForName).toList

        val aggs = msg.aggregations.map(a => Aggregation(vpColumns.getColumnForName(a.column).get, a.aggType.toShort)).toList

        val groupBy = new GroupBy(groupByColumns, aggs)

        viewPortContainer.create(ctx.requestId, ctx.session, ctx.queue, table, msg.range, vpColumns, sort, filter, groupBy)
      }

      vsMsg(CreateViewPortSuccess(viewPort.id, viewPort.table.name, msg.range, msg.columns, msg.sort, msg.groupBy, msg.filterSpec, msg.aggregations))(ctx)
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
    Try(viewPortContainer.changeSelection(ctx.session, ctx.queue, msg.vpId, ViewPortSelectedIndices(msg.selection))) match {
      case Success(vp) =>
        vsMsg(SetSelectionSuccess(vp.id, vp.getSelection.values.toArray))(ctx)
      case Failure(e) =>
        logger.error("Could not change VP selection:", e.getMessage)
        errorMsg("Could not change VP selection:" + e.getMessage)(ctx)
    }
  }

  override def process(msg: GetViewPortVisualLinksRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.getViewPortVisualLinks(ctx.session, msg.vpId)) match {
      case Success(linksAndViewPorts) =>
        vsMsg(GetViewPortVisualLinksResponse(msg.vpId, linksAndViewPorts.map({ case (link, viewPort) => AvailableViewPortVisualLink(viewPort.id, link) })))(ctx)
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

  override def process(msg: RemoveVisualLinkRequest)(ctx: RequestContext): Option[ViewServerMessage] = {
    Try(viewPortContainer.unlinkViewPorts(ctx.session, ctx.queue, msg.childVpId)) match {
      case Success(_) =>
        vsMsg(RemoveVisualLinkSuccess(childVpId = msg.childVpId))(ctx)
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

  override def process(msg: RpcRequest)(ctx: RequestContext): Option[ViewServerMessage] =
    msg.context match {
      case context: ViewPortContext => handleViewPortRpcRequest(msg, context.viewPortId, ctx)
      case context => vsMsg(createErrorRpcResponse(msg, s"Unsupported request context type $context"))(ctx)
    }

  private def handleViewPortRpcRequest(msg: RpcRequest, viewPortId: String, ctx: RequestContext) = {
    val response = Try(viewPortContainer.handleRpcRequest(viewPortId, msg.rpcName, msg.params)(ctx)) match {
      case Success(functionResult) =>
        logger.debug(s"Processed Rpc Request ${ctx.requestId} " + msg)
        functionResult match {
          case RpcFunctionSuccess(data) =>
            RpcResponseNew(rpcName = msg.rpcName, result = RpcSuccessResult(data), NoneAction())
          case RpcFunctionFailure(errorCode, error, exception) =>
            createErrorRpcResponse(msg, error)
        }
      case Failure(e) =>
        logger.warn(s"Failed to process Rpc Request ${ctx.requestId}", e)
        createErrorRpcResponse(msg, e.toString)
    }
    vsMsg(response)(ctx)
  }

  private def createErrorRpcResponse(msg: RpcRequest, errorMessage: String) = {
    RpcResponseNew(
      rpcName = msg.rpcName,
      result = RpcErrorResult(errorMessage),
      action = ShowNotificationAction(NotificationType.Error, s"Failed to process ${msg.rpcName} request", errorMessage))
  }
}