package org.finos.vuu.net.rpc

import org.finos.vuu.net.rpc.Rpc

object RpcNames {
  val UniqueFieldValuesRpc: Rpc.FunctionName = "getUniqueFieldValues"
  val UniqueFieldValuesStartWithRpc: Rpc.FunctionName = "getUniqueFieldValuesStartingWith"

  // in EditTableRpcHandler
  val DeleteRowRpc: Rpc.FunctionName = "deleteRow"
  val DeleteSelectedRowsRpc: Rpc.FunctionName = "deleteSelectedRows"
  val DeleteCellRpc: Rpc.FunctionName = "deleteCell"
  val AddRowRpc: Rpc.FunctionName = "addRow"
  val EditRowRpc: Rpc.FunctionName = "editRow"
  val EditCellRpc: Rpc.FunctionName = "editCell"
  val SubmitFormRpc: Rpc.FunctionName = "submitForm"
  val CloseFormRpc: Rpc.FunctionName = "closeForm"
  val UndoRowChangeRpc: Rpc.FunctionName = "undoRowChange"

  val CreateSessionTableRpc: Rpc.FunctionName = "createSessionTable"
  val EndEditSessionRpc: Rpc.FunctionName = "endEditSession"
}
