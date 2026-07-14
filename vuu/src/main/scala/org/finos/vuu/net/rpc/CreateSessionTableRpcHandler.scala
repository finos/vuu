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
        val to = if (vp.getKeys.length > tableContainer.rpcOptions.maxCopySize) tableContainer.rpcOptions.maxCopySize else vp.getKeys.length
        var i = 0
        val vpColumns = ViewPortColumnCreator.create(params.viewPort.table.asTable, columnsToCopy)
        while (i < to) {
          if (columnsToCopy.isEmpty) {
            sessionTable.processUpdate(vp.table.pullRow(vp.getKeys.get(i)))
          } else {
            sessionTable.processUpdate(vp.table.pullRow(vp.getKeys.get(i), vpColumns))
          }
          i += 1
        }
      case Selected =>
        val vp = params.viewPort
        val vpKeys = vp.getKeys
        val selection = vp.getSelection
        val vpColumns = ViewPortColumnCreator.create(params.viewPort.table.asTable, columnsToCopy.toList)
        for (key <- selection) {
          if (columnsToCopy.isEmpty) {
            sessionTable.processUpdate(vp.table.pullRow(key))
          } else {
            sessionTable.processUpdate(vp.table.pullRow(key, vpColumns))
          }
        }
      case Empty =>
    }
    RpcFunctionSuccess(Some(Map("sessionTable" -> sessionTable.name, "module" -> sessionTable.tableDef.getModule().name)))
  }
}
