package org.finos.vuu.net.rpc

import org.finos.vuu.core.table.TableContainer

class EditInSessionTableRpcHandler(using val tableContainer: TableContainer) extends DefaultRpcHandler {
  registerRpc(RpcNames.BeginEditSessionRpc, this.beginEditSession)
  registerRpc(RpcNames.EndEditSessionRpc, this.endEditSession)

  def beginEditSession(params: RpcParams): RpcFunctionResult = {
    // check if tabledef editable, if so create session table based on enum, if no reject
    null
  }


  def endEditSession(params: RpcParams): RpcFunctionResult = {
    // close session table
    null
  }

}
