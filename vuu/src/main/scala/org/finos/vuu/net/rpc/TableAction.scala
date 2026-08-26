package org.finos.vuu.net.rpc

enum TableAction(val value: String) {
  case AddRow extends TableAction("addRow")
  case EditCell extends TableAction("editCell")
  case DeleteRow extends TableAction("deleteRow")
}
