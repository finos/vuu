package org.finos.vuu.net.rpc

import org.finos.vuu.core.table.TableContainer
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.SessionTableCopyOption.All
import org.finos.vuu.net.rpc.SessionTableCopyOption.Empty
import org.finos.vuu.net.rpc.SessionTableCopyOption.Selected
import org.finos.vuu.viewport.ViewPortTable

class EditInSessionTableRpcHandler(using val tableContainer: TableContainer) extends DefaultRpcHandler {
  registerRpc(RpcNames.BeginEditSessionRpc, this.beginEditSession)
  registerRpc(RpcNames.EndEditSessionRpc, this.endEditSession)

  def beginEditSession(params: RpcParams): RpcFunctionResult = {
    val session: ClientSessionId = params.ctx.session
    val sourceTable = params.viewPort.table
    val copyOption = SessionTableCopyOption.fromString(params.namedParams("copyOption").asInstanceOf[String])
    val columnsToCopy = params.namedParams("columnsToCopy").asInstanceOf[String].split(",")
    val sessionTableName = params.namedParams("sessionTableName").asInstanceOf[String]

    if (!sourceTable.asTable.getTableDef.isEditable) {
      return new RpcFunctionFailure(s"Table ${sourceTable.name} is not editable")
    }

    val validColumns = sourceTable.asTable.columnsForNames(columnsToCopy.toList)
      .filter(c => c != null && c.isEditable)
      .map(_.name)
    val invalidColumns = columnsToCopy.filterNot(validColumns.contains)
    if (invalidColumns.nonEmpty) {
      return new RpcFunctionFailure(s"Non-editable column(s) [${invalidColumns.mkString(", ")}]")
    }

    val sessionTableSource = tableContainer.getTable(sessionTableName)
    val sessionTable = tableContainer.createSimpleSessionTable(sessionTableSource, session)

    copyOption match {
      case All =>
        val size = sourceTable.asTable.size()
        val keys = sourceTable.asTable.primaryKeys
      //TODO #2169 add a config to limit the max rows to copy
      // TODO #2169 copy all/max rows rows to session table
      case Selected =>
      //TODO #2169 copy selected rows
      // sort keys? val keys = aSort.doSort(table.sourceTable, filteredKeys, vpColumns)
      case Empty =>

    }
    RpcFunctionSuccess(Some(ViewPortTable(sessionTable.name, sessionTable.tableDef.getModule().name)))
  }

  def endEditSession(params: RpcParams): RpcFunctionResult = {
    // TODO #2169 validate data and update vuuMsg
    // do expected operation
    // close session table
    null
  }
}
