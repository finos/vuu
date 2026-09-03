package org.finos.vuu.net.rpc.sessiontable

import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.table.{InMemSessionDataTable, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.sessiontable.SessionTableCopyOption.{All, Empty, Selected}
import org.finos.vuu.net.rpc.{RpcFunctionFailure, RpcFunctionResult, RpcFunctionSuccess, RpcHandler, RpcNames, RpcParams, RpcPermissionChecker}
import org.finos.vuu.viewport.{OpenDialogViewPortAction, RowSource, ViewPort, ViewPortTable}

trait CreateSessionTableRpcHandler extends RpcHandler {

  val tableContainer: TableContainer
  val rpcPermissionChecker: RpcPermissionChecker

  registerCreateSessionTableRpcs()

  protected final def registerCreateSessionTableRpcs(): Unit = {
    registerRpc(RpcNames.CreateSessionTableRpc, this.createSessionTable)
  }

  def createSessionTable(params: RpcParams): RpcFunctionResult = {
    params.namedParams.get("sessionType") match {
      case Some("edit") => createSessionTableForEdit(params)
      case Some("import") => createSessionTableForImport(params)
      case Some("export") => createSessionTableForExport(params)
      case _ => new RpcFunctionFailure("Session type undefined")
    }
  }

  def createSessionTableForEdit(params: RpcParams): RpcFunctionResult = {
    if (!rpcPermissionChecker.isRpcAllowed(RpcNames.CreateSessionTableRpc, params.ctx.user)) {
      logger.warn(s"User ${params.ctx.user.name} does not have permission to call ${RpcNames.CreateSessionTableRpc} for edit")
      return new RpcFunctionFailure("No permission to create session table for edit.")
    }

    val session: ClientSessionId = params.ctx.session
    val sourceTable = params.viewPort.table

    if (!sourceTable.asTable.getTableDef.options.isEditable) {
      logger.warn(s"Table ${sourceTable.name} is not editable")
      return new RpcFunctionFailure("Table not editable")
    }

    val copyOption = SessionTableCopyOption.fromString(params.namedParams("copyOption").asInstanceOf[String])
    val sessionTableName = params.namedParams.get("sessionTableName") match {
      case Some(value) => value.asInstanceOf[String]
      case None => s"edit-${sourceTable.name}"
    }

    val columnsToCopy =
      try {
        getColumnsToCopy(params, sourceTable)
      } catch {
        case _: IllegalArgumentException =>
          return new RpcFunctionFailure("Column(s) not found in source table.")
      }

    val sessionTableSource = tableContainer.getTable(sessionTableName)
    val sessionTable = tableContainer.createSimpleSessionTable(sessionTableSource, session)
    copyDataToSessionTable(copyOption, params.viewPort, sessionTable, columnsToCopy)
    RpcFunctionSuccess(Some(OpenDialogViewPortAction(ViewPortTable(sessionTable.name, sessionTable.tableDef.getModule().name), "")))
  }

  def createSessionTableForImport(params: RpcParams): RpcFunctionResult = {
    if (!rpcPermissionChecker.isRpcAllowed(RpcNames.CreateSessionTableRpc, params.ctx.user)) {
      logger.warn(s"User ${params.ctx.user.name} does not have permission to call ${RpcNames.CreateSessionTableRpc} for import")
      return new RpcFunctionFailure("No permission to create session table for import.")
    }

    val session: ClientSessionId = params.ctx.session
    val sourceTable = params.viewPort.table

    if (!sourceTable.asTable.getTableDef.options.isEditable) {
      logger.warn(s"Table ${sourceTable.name} is not editable")
      return new RpcFunctionFailure("Table not editable")
    }

    val sessionTableName = params.namedParams.get("sessionTableName") match {
      case Some(value) => value.asInstanceOf[String]
      case None => s"import-${sourceTable.name}"
    }

    val columnsToCopy =
      try {
        getColumnsToCopy(params, sourceTable)
      } catch {
        case _: IllegalArgumentException =>
          return new RpcFunctionFailure("Column(s) not found in source table.")
      }

    val sessionTableSource = tableContainer.getTable(sessionTableName)
    val sessionTable = tableContainer.createSimpleSessionTable(sessionTableSource, session)
    copyDataToSessionTable(Empty, params.viewPort, sessionTable, columnsToCopy)
    RpcFunctionSuccess(Some(OpenDialogViewPortAction(ViewPortTable(sessionTable.name, sessionTable.tableDef.getModule().name), "")))
  }

  def createSessionTableForExport(params: RpcParams): RpcFunctionResult = {
    // No permission check by default. Allow export for all users.
    val session: ClientSessionId = params.ctx.session
    val sourceTable = params.viewPort.table
    val sessionTableName = params.namedParams.get("sessionTableName") match {
      case Some(value) => value.asInstanceOf[String]
      case None => s"export-${sourceTable.name}"
    }

    val columnsToCopy =
      try {
        getColumnsToCopy(params, sourceTable)
      } catch {
        case _: IllegalArgumentException =>
          return new RpcFunctionFailure("Column(s) not found in source table.")
      }

    val sessionTableSource = tableContainer.getTable(sessionTableName)
    val sessionTable = tableContainer.createSimpleSessionTable(sessionTableSource, session)
    copyDataToSessionTable(All, params.viewPort, sessionTable, columnsToCopy)
    RpcFunctionSuccess(Some(OpenDialogViewPortAction(ViewPortTable(sessionTable.name, sessionTable.tableDef.getModule().name), "")))
  }

  def copyDataToSessionTable(copyOption: SessionTableCopyOption, vp: ViewPort, sessionTable: InMemSessionDataTable, columns: List[String]): Unit = {
    copyOption match {
      case All =>
        val vpColumns = ViewPortColumnCreator.create(vp.table.asTable, columns)
        val iterator = vp.getKeys.iterator.take(tableContainer.rpcOptions.maxSessionTableSize)
        while (iterator.hasNext) {
          sessionTable.processUpdate(vp.table.pullRow(iterator.next(), vpColumns))
        }
      case Selected =>
        val vpColumns = ViewPortColumnCreator.create(vp.table.asTable, columns)
        val iterator = vp.getSelection.iterator.take(tableContainer.rpcOptions.maxSessionTableSize)
        while (iterator.hasNext) {
          sessionTable.processUpdate(vp.table.pullRow(iterator.next(), vpColumns))
        }
      case Empty =>
    }
  }

  private def getColumnsToCopy(params: RpcParams, sourceTable: RowSource): List[String] = {
    val columnsToCopy = params.namedParams.get("columnsToCopy") match {
      case Some(value) =>
        val columnsToCopyStr = value.asInstanceOf[String]
        if (columnsToCopyStr == null || columnsToCopyStr.isBlank || columnsToCopyStr.equals("*")) {
          sourceTable.asTable.getTableDef.customColumns.map(_.name).toList // exclude default columns
        } else {
          columnsToCopyStr.split(",").toList
        }
      case None =>
        sourceTable.asTable.getTableDef.customColumns.map(_.name).toList // exclude default columns
    }

    val columnsInSource = sourceTable.asTable.columnsForNames(columnsToCopy)
      .filter(_ != null)
      .map(_.name)
    val columnsNotInSource = columnsToCopy.filterNot(columnsInSource.contains)
    if (columnsNotInSource.nonEmpty) {
      logger.warn(s"Column(s) [${columnsNotInSource.mkString(", ")}] not found in table ${sourceTable.name}")
      throw new IllegalArgumentException("Column(s) not found in source table.")
    }

    columnsToCopy
  }
}
