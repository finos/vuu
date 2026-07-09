package org.finos.vuu.net.rpc

import org.finos.vuu.core.table.TableContainer
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.SessionTableCopyOption.All
import org.finos.vuu.net.rpc.SessionTableCopyOption.Empty
import org.finos.vuu.net.rpc.SessionTableCopyOption.Selected

class EditInSessionTableRpcHandler(using val tableContainer: TableContainer) extends DefaultRpcHandler {
  registerRpc(RpcNames.BeginEditSessionRpc, this.beginEditSession)
  registerRpc(RpcNames.EndEditSessionRpc, this.endEditSession)

  def beginEditSession(params: RpcParams): RpcFunctionResult = {
    val session: ClientSessionId = params.ctx.session
    val copyOption = SessionTableCopyOption.fromString(params.namedParams("copyOption").asInstanceOf[String])
    val table = params.viewPort.table
    val columnsToCopy = params.namedParams("columnsToCopy").asInstanceOf[String].split(",")

    if (!table.asTable.getTableDef.isEditable) {
      new RpcFunctionFailure(s"Table ${table.name} is not editable")
    }

    val invalidColumns = table.asTable.columnsForNames(columnsToCopy.toList)
      .filter(!_.isEditable)
    if (invalidColumns.nonEmpty) {
      new RpcFunctionFailure(s"Column ${invalidColumns.mkString(", ")} is not editable")
    }

    val sessionTableName = table.name + "_session"
    val sessionTable = tableContainer.createSimpleSessionTable(table, session)

    val size = table.asTable.size()
    val keys = table.asTable.primaryKeys

    copyOption match {
      case All =>
      //TODO #2169 add a config to limit the max rows to copy
      // TODO #2169 copy all/max rows rows to session table
      case Selected =>
      //TODO #2169 copy selected rows
      // sort keys? val keys = aSort.doSort(table.sourceTable, filteredKeys, vpColumns)
      case Empty =>

    }
    RpcFunctionSuccess(Some(sessionTableName))
  }

  def endEditSession(params: RpcParams): RpcFunctionResult = {
    // TODO #2169 validate data and update vuuMsg
    // do expected operation
    // close session table
    null
  }
}
