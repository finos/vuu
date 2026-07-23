package org.finos.vuu.net.rpc

import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.table.{TableContainer, ViewPortColumnCreator}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.SessionTableCopyOption.{All, Empty, Selected}

class CreateSessionTableRpcHandler(using tableContainer: TableContainer, rpcPermissionChecker: RpcPermissionChecker) extends DefaultRpcHandler {
  registerRpc(RpcNames.CreateSessionTableRpc, this.createSessionTable)

  def createSessionTable(params: RpcParams): RpcFunctionResult = {
    val vuuUser: VuuUser = params.ctx.user
    if (!rpcPermissionChecker.isRpcAllowed(RpcNames.CreateSessionTableRpc, vuuUser)) {
      logger.error(s"User ${vuuUser.name} does not have permission to call ${RpcNames.CreateSessionTableRpc}")
      return new RpcFunctionFailure(s"Failed to create session table for user ${vuuUser.name}")
    }

    val session: ClientSessionId = params.ctx.session
    val sourceTable = params.viewPort.table
    val copyOption = SessionTableCopyOption.fromString(params.namedParams("copyOption").asInstanceOf[String])
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
    val sessionTableName = params.namedParams.get("sessionTableName") match {
      case Some(value) => value.asInstanceOf[String]
      case None => s"edit-${sourceTable.name}"
    }

    if (!sourceTable.asTable.getTableDef.isEditable) {
      return new RpcFunctionFailure(s"Table ${sourceTable.name} is not editable")
    }

    val columnsInSource = sourceTable.asTable.columnsForNames(columnsToCopy)
      .map(_.name)
    val columnsNotInSource = columnsToCopy.filterNot(columnsInSource.contains)
    if (columnsNotInSource.nonEmpty) {
      return new RpcFunctionFailure(s"Column(s) [${columnsNotInSource.mkString(", ")} not found in table ${sourceTable.name}]")
    }

    val sessionTableSource = tableContainer.getTable(sessionTableName)
    val sessionTable = tableContainer.createSimpleSessionTable(sessionTableSource, session)
    copyOption match {
      case All =>
        val vp = params.viewPort
        val vpColumns = ViewPortColumnCreator.create(params.viewPort.table.asTable, columnsToCopy)
        val iterator = vp.getKeys.iterator.take(tableContainer.rpcOptions.maxCopySize)
        while (iterator.hasNext) {
          sessionTable.processUpdate(vp.table.pullRow(iterator.next(), vpColumns))
        }
      case Selected =>
        val vp = params.viewPort
        val vpColumns = ViewPortColumnCreator.create(params.viewPort.table.asTable, columnsToCopy)
        val iterator = vp.getSelection.iterator.take(tableContainer.rpcOptions.maxCopySize)
        while (iterator.hasNext) {
          sessionTable.processUpdate(vp.table.pullRow(iterator.next(), vpColumns))
        }
      case Empty =>
    }
    RpcFunctionSuccess(Some(Map("sessionTable" -> sessionTable.name, "module" -> sessionTable.tableDef.getModule().name)))
  }
}
