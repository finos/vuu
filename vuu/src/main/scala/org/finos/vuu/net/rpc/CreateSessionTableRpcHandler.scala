package org.finos.vuu.net.rpc

import org.finos.vuu.core.table.{TableContainer, ViewPortColumnCreator}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.SessionTableCopyOption.{All, Empty, Selected}

class CreateSessionTableRpcHandler(using val tableContainer: TableContainer) extends DefaultRpcHandler {
  registerRpc(RpcNames.CreateSessionTableRpc, this.createSessionTable)

  def createSessionTable(params: RpcParams): RpcFunctionResult = {
    val session: ClientSessionId = params.ctx.session
    val sourceTable = params.viewPort.table
    val copyOption = SessionTableCopyOption.fromString(params.namedParams("copyOption").asInstanceOf[String])
    val columnsToCopyStr = params.namedParams.get("columnsToCopy") match {
      case Some(value) => value.asInstanceOf[String]
      case None => null
    }
    val columnsToCopy = if (columnsToCopyStr == null || columnsToCopyStr.isBlank || columnsToCopyStr.equals("*")) {
      sourceTable.asTable.getTableDef.customColumns.map(_.name).toList // exclude default columns
    } else {
      columnsToCopyStr.split(",").toList
    }
    val sessionTableName = params.namedParams.get("sessionTableName") match {
      case Some(value) => value.asInstanceOf[String]
      case None => s"Edit-${sourceTable.name}"
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
