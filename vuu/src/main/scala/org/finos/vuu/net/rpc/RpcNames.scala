package org.finos.vuu.net.rpc

import org.finos.vuu.net.rpc.Rpc

object RpcNames {
  val UniqueFieldValuesRpc: Rpc.FunctionName = "getUniqueFieldValues"
  val UniqueFieldValuesStartWithRpc: Rpc.FunctionName = "getUniqueFieldValuesStartingWith"

  val DeleteRowRpc: Rpc.FunctionName = "deleteRow"
  val DeleteCellRpc: Rpc.FunctionName = "deleteCell"
  val AddRowRpc: Rpc.FunctionName = "addRow"
  val EditRowRpc: Rpc.FunctionName = "editRow"
  val EditCellRpc: Rpc.FunctionName = "editCell"
  val OnFormSubmitRpc: Rpc.FunctionName = "onFormSubmit"
  val OnFormCloseRpc: Rpc.FunctionName = "onFormClose"
}
