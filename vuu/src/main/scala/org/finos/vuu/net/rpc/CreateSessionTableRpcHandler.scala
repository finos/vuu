package org.finos.vuu.net.rpc

import org.finos.vuu.core.table.TableContainer
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.SessionTableCopyOption.All
import org.finos.vuu.net.rpc.SessionTableCopyOption.Empty
import org.finos.vuu.net.rpc.SessionTableCopyOption.Selected
import org.finos.vuu.viewport.ViewPortTable

class CreateSessionTableRpcHandler(using val tableContainer: TableContainer) extends DefaultRpcHandler {
  registerRpc(RpcNames.CreateSessionTableRpc, this.createSessionTable)

  def createSessionTable(params: RpcParams): RpcFunctionResult = {
    val session: ClientSessionId = params.ctx.session
    val sourceTable = params.viewPort.table
    val copyOption = SessionTableCopyOption.fromString(params.namedParams("copyOption").asInstanceOf[String])
    val columnsToCopy = params.namedParams("columnsToCopy").asInstanceOf[String].split(",")
    val sessionTableName = params.namedParams("sessionTableName").asInstanceOf[String]

    if (!sourceTable.asTable.getTableDef.isEditable) {
      return new RpcFunctionFailure(s"Table ${sourceTable.name} is not editable")
    }

    val validColumns = sourceTable.asTable.columnsForNames(columnsToCopy.toList)
      .map(_.name)
    val invalidColumns = columnsToCopy.filterNot(validColumns.contains)
    if (invalidColumns.nonEmpty) {
      return new RpcFunctionFailure(s"Column(s) [${invalidColumns.mkString(", ")} not found in table ${sourceTable.name}]")
    }

    val sessionTableSource = tableContainer.getTable(sessionTableName)
    val sessionTable = tableContainer.createSimpleSessionTable(sessionTableSource, session)

    copyOption match {
      case All =>
        val vp = params.viewPort
        val vpKeys = vp.getKeys
        val to = if (vp.getKeys.length > tableContainer.rpcOptions.maxCopySize) tableContainer.rpcOptions.maxCopySize else vp.getKeys.length
        var i = 0
        while (i < to) {
          sessionTable.processUpdate(vp.table.pullRow(vpKeys.get(i))) // TODO 2169 copy all columns but allow user to subscribe to a subset in session table??
          // we need the column to be aviailable in view port - how do we handle it if it's not there
          // make sure keys are sorted in vp?
          i += 1
        }
      case Selected =>
        val vp = params.viewPort
        val vpKeys = vp.getKeys
        val selection = vp.getSelection
        for (key <- selection) { // TODO 2169 do we care about sorting???
          sessionTable.processUpdate(vp.table.pullRow(key))
        }
      case Empty =>
    }
    RpcFunctionSuccess(Some(ViewPortTable(sessionTable.name, sessionTable.tableDef.getModule().name)))
  }
}
