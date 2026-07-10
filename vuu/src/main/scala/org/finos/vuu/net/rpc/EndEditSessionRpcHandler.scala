package org.finos.vuu.net.rpc

import org.finos.vuu.core.table.TableContainer

trait EndEditSessionRpcHandler(using val tableContainer: TableContainer) extends DefaultRpcHandler {
  registerRpc(RpcNames.EndEditSessionRpc, this.endEditSession)


  // todo when closing session table, front end sends close view port request, and then server removes session table

  def endEditSession(params: RpcParams): RpcFunctionResult = {
    // TODO #2169 validate data and update vuuMsg
    // do expected operation - add methods in this interface
    // close session table
    null
  }

  def validData(): Boolean

  def submitData(): Boolean
}
