package org.finos.vuu.net.rpc.sessiontable

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

  private def createSessionTableForEdit(params: RpcParams): RpcFunctionResult = {
    if (!rpcPermissionChecker.isRpcAllowed(RpcNames.CreateSessionTableRpc, params.ctx.user)) {
      logger.warn(s"User ${params.ctx.user.name} does not have permission to call ${RpcNames.CreateSessionTableRpc} for edit")
      return new RpcFunctionFailure("No permission to create session table for edit.")
    }

    val viewPort = params.viewPort
    val sourceTable = params.viewPort.table

    if (!sourceTable.asTable.getTableDef.options.isEditable) {
      logger.warn(s"Table ${sourceTable.name} is not editable")
      return new RpcFunctionFailure("Table not editable")
    }

    val sessionTableName = params.namedParams.get("sessionTableName") match {
      case Some(value: String) => value
      case _ => s"edit-${sourceTable.name}"
    }

    val copyOption = params.namedParams.get("copyOption") match {
      case Some(value: String) => SessionTableCopyOption.fromString(value)
      case _ => return new RpcFunctionFailure("Missing or invalid copy option.")
    }

    val columnsToCopy =
      try {
        getColumnsToCopy(params, sourceTable)
      } catch {
        case _: IllegalArgumentException =>
          return new RpcFunctionFailure("Column(s) not found in source table.")
      }

    val sessionTableSource = tableContainer.getTable(sessionTableName)
    val sessionTable = tableContainer.createSimpleSessionTable(sessionTableSource, params.ctx.session)
    sourceTable.asTable.getSessionTableExportProvider.exportData(viewPort, sessionTable, columnsToCopy, copyOption)

    RpcFunctionSuccess(Some(OpenDialogViewPortAction(ViewPortTable(sessionTable.name, sessionTable.tableDef.getModule().name), "")))
  }

  private def createSessionTableForImport(params: RpcParams): RpcFunctionResult = {
    if (!rpcPermissionChecker.isRpcAllowed(RpcNames.CreateSessionTableRpc, params.ctx.user)) {
      logger.warn(s"User ${params.ctx.user.name} does not have permission to call ${RpcNames.CreateSessionTableRpc} for import")
      return new RpcFunctionFailure("No permission to create session table for import.")
    }

    val sourceTable = params.viewPort.table
    if (!sourceTable.asTable.getTableDef.options.isEditable) {
      logger.warn(s"Table ${sourceTable.name} is not editable")
      return new RpcFunctionFailure("Table not editable")
    }

    val sessionTableName = params.namedParams.get("sessionTableName") match {
      case Some(value: String) => value
      case _ => s"import-${sourceTable.name}"
    }

    val sessionTableSource = tableContainer.getTable(sessionTableName)
    val sessionTable = tableContainer.createSimpleSessionTable(sessionTableSource, params.ctx.session)

    RpcFunctionSuccess(Some(OpenDialogViewPortAction(ViewPortTable(sessionTable.name, sessionTable.tableDef.getModule().name), "")))
  }

  private def createSessionTableForExport(params: RpcParams): RpcFunctionResult = {
    val viewPort = params.viewPort
    
    val sourceTable = viewPort.table
    val sessionTableName = params.namedParams.get("sessionTableName") match {
      case Some(value: String) => value
      case _ => s"export-${sourceTable.name}"
    }

    val copyOption = params.namedParams.get("copyOption") match {
      case Some(value: String) => SessionTableCopyOption.fromString(value)
      case _ => return new RpcFunctionFailure("Missing or invalid copy option.")
    }

    val columnsToCopy =
      try {
        getColumnsToCopy(params, sourceTable)
      } catch {
        case _: IllegalArgumentException =>
          return new RpcFunctionFailure("Column(s) not found in source table.")
      }

    val sessionTableSource = tableContainer.getTable(sessionTableName)
    val sessionTable = tableContainer.createSimpleSessionTable(sessionTableSource, params.ctx.session)
    sourceTable.asTable.getSessionTableExportProvider.exportData(viewPort, sessionTable, columnsToCopy, copyOption)

    RpcFunctionSuccess(Some(OpenDialogViewPortAction(ViewPortTable(sessionTable.name, sessionTable.tableDef.getModule().name), "")))
  }

  private def getColumnsToCopy(params: RpcParams, sourceTable: RowSource): List[String] = {
    val columnsToCopy = params.namedParams.get("columnsToCopy") match {
      case Some(value: String) =>
        if (value == null || value.isBlank || value.equals("*")) {
          sourceTable.asTable.getTableDef.customColumns.map(_.name).toList // exclude default columns
        } else {
          value.split(",").toList
        }
      case _ =>
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
