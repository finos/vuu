package org.finos.vuu.net.rpc

import org.finos.vuu.core.table.TableContainer
import org.finos.vuu.net.ClientSessionId

class EditInSessionTableRpcHandler(using val tableContainer: TableContainer) extends DefaultRpcHandler {
  registerRpc(RpcNames.BeginEditSessionRpc, this.beginEditSession)
  registerRpc(RpcNames.EndEditSessionRpc, this.endEditSession)

  def beginEditSession(params: RpcParams): RpcFunctionResult = {
    val session: ClientSessionId = params.ctx.session
    val copyOption = SessionTableCopyOption.fromString(params.namedParams("key").asInstanceOf[String])
    val table = params.viewPort.table
    val columnToCopyFrom = params.namedParams("key").asInstanceOf[String].split(",")

    // check if tabledef editable, if so create session table based on enum, if no reject
    // do we throw if deserialise fail? and reject?

    val tableName = table.name
    val sessionTableName = tableName + "_session"
    val sessionTable = tableContainer.createSimpleSessionTable(table, session)

    // add a config to limit the max rows to copy

    null
  }

  def endEditSession(params: RpcParams): RpcFunctionResult = {
    // close session table
    null
  }
}
