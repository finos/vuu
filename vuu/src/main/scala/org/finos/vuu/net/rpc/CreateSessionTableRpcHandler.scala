package org.finos.vuu.net.rpc

import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.table.{InMemSessionDataTable, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.SessionTableCopyOption.{All, Empty, Selected}
import org.finos.vuu.viewport.{RowSource, ViewPort}

trait CreateSessionTableRpcHandler(rpcPermissionChecker: RpcPermissionChecker, tableContainer: TableContainer) extends RpcHandler {
  registerRpc(RpcNames.CreateSessionTableRpc, this.createSessionTable)

  def createSessionTable(params: RpcParams): RpcFunctionResult = {
    val vuuUser: VuuUser = params.ctx.user
    // TODO 2231 handle different permission for edit/import/export
    if (!rpcPermissionChecker.isRpcAllowed(RpcNames.CreateSessionTableRpc, vuuUser)) {
      logger.warn(s"User ${vuuUser.name} does not have permission to call ${RpcNames.CreateSessionTableRpc}")
      return new RpcFunctionFailure("No permission to create session table.")
    }

    params.namedParams.get("sessionType") match {
      case Some("edit") => createSessionTableForEdit(params)
      case Some("import") => createSessionTableForImport(params)
      case Some("export") => createSessionTableForExport(params)
      case _ => new RpcFunctionFailure("Session type undefined")
    }
  }

  def createSessionTableForEdit(params: RpcParams): RpcFunctionResult = {
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
    RpcFunctionSuccess(Some(Map("sessionTable" -> sessionTable.name, "module" -> sessionTable.tableDef.getModule().name)))
  }

  def createSessionTableForImport(params: RpcParams): RpcFunctionResult = {
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
    RpcFunctionSuccess(Some(Map("sessionTable" -> sessionTable.name, "module" -> sessionTable.tableDef.getModule().name)))
  }

  def createSessionTableForExport(params: RpcParams): RpcFunctionResult = {
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
    RpcFunctionSuccess(Some(Map("sessionTable" -> sessionTable.name, "module" -> sessionTable.tableDef.getModule().name)))
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
