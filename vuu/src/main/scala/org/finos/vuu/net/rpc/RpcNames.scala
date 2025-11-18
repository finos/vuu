package org.finos.vuu.net.rpc

import org.finos.vuu.net.rpc.Rpc

object RpcNames {
  val UniqueFieldValuesRpc: Rpc.FunctionName = "getUniqueFieldValues"
  val UniqueFieldValuesStartWithRpc: Rpc.FunctionName = "getUniqueFieldValuesStartingWith"

  val DeleteRowRpc: Rpc.FunctionName = "deleteRow"
  val DeleteCellRpc: Rpc.FunctionName = "deleteCell"
  val addRowRpc: Rpc.FunctionName = "addRow"
  val editCellRpc: Rpc.FunctionName = "editCell"
  val editRowRpc: Rpc.FunctionName = "editRow"
  val onFormSubmitRpc: Rpc.FunctionName = "onFormSubmit"
  val onFormCloseRpc: Rpc.FunctionName = "onFormClose"
}
