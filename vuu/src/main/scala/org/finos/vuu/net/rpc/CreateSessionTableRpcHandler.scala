package org.finos.vuu.net.rpc

import org.finos.vuu.core.table.{InMemSessionDataTable, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.SessionTableCopyOption.{All, Empty, Selected}
import org.finos.vuu.viewport.{RowSource, ViewPort, ViewPortColumns}

class CreateSessionTableRpcHandler(using val tableContainer: TableContainer) extends DefaultRpcHandler {
  registerRpc(RpcNames.CreateSessionTableRpc, this.createSessionTable)

  def createSessionTable(params: RpcParams): RpcFunctionResult = {
    val session: ClientSessionId = params.ctx.session
    val sourceTable = params.viewPort.table
    val copyOption = SessionTableCopyOption.fromString(params.namedParams("copyOption").asInstanceOf[String])
    val columnsToCopyStr = params.namedParams("columnsToCopy").asInstanceOf[String]
    val columnsToCopy = if (columnsToCopyStr.equals("*")) List.empty[String] else columnsToCopyStr.split(",").toList
    val sessionTableName = params.namedParams("sessionTableName").asInstanceOf[String]

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
        copyRows(iterator, sessionTable, vp.table, vpColumns, columnsToCopy)
      case Selected =>
        val vp = params.viewPort
        val vpColumns = ViewPortColumnCreator.create(params.viewPort.table.asTable, columnsToCopy)
        val iterator = vp.getSelection.iterator.take(tableContainer.rpcOptions.maxCopySize)
        copyRows(iterator, sessionTable, vp.table, vpColumns, columnsToCopy)
      case Empty =>
    }
    RpcFunctionSuccess(Some(Map("sessionTable" -> sessionTable.name, "module" -> sessionTable.tableDef.getModule().name)))
  }

  private def copyRows(iterator: Iterator[String], sessionTable: InMemSessionDataTable, sourceTable: RowSource, vpColumns: ViewPortColumns, columnsToCopy: List[String]): Unit = {
    while (iterator.hasNext) {
      if (columnsToCopy.isEmpty) {
        sessionTable.processUpdate(sourceTable.pullRow(iterator.next()))
      } else {
        sessionTable.processUpdate(sourceTable.pullRow(iterator.next(), vpColumns))
      }
    }
  }
}
