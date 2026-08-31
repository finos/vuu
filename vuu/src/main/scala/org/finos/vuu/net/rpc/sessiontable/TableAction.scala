package org.finos.vuu.net.rpc.sessiontable

enum TableAction(val value: String) {
  case AddRow extends TableAction("addRow")
  case EditCell extends TableAction("editCell")
  case DeleteRow extends TableAction("deleteRow")
}


object TableAction {
  val ADD_ROW: TableAction = TableAction.AddRow
  val EDIT_CELL: TableAction = TableAction.EditCell
  val DELETE_ROW: TableAction = TableAction.DeleteRow
}