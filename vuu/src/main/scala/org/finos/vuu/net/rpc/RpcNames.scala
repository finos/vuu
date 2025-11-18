package org.finos.vuu.net.rpc

import org.finos.vuu.net.rpc.Rpc

object RpcNames {
  val UniqueFieldValuesRpc: Rpc.FunctionName = "getUniqueFieldValues"
  val UniqueFieldValuesStartWithRpc: Rpc.FunctionName = "getUniqueFieldValuesStartingWith"

  val DeleteRowRpc: Rpc.FunctionName = "deleteRow"
  val DeleteCellRpc: Rpc.FunctionName = "deleteCell"
  val AddRowRpc: Rpc.FunctionName = "addRow"
  val EditCellRpc: Rpc.FunctionName = "editCell"
  val EditRowRpc: Rpc.FunctionName = "editRow"
  val OnFormSubmitRpc: Rpc.FunctionName = "onFormSubmit"
  val OnFormCloseRpc: Rpc.FunctionName = "onFormClose"
}
