package org.finos.vuu.net.rpc.sessiontable

enum TableAction(val external: String) extends java.lang.Enum[TableAction] {
  case AddRow extends TableAction("addRow")
  case EditCell extends TableAction("editCell")
  case DeleteRow extends TableAction("deleteRow")
}

object TableAction {

  def fromExternal(external: String): TableAction = {
    external match {
      case AddRow.external => AddRow
      case EditCell.external => EditCell
      case DeleteRow.external => DeleteRow
      case _ => throw new IllegalArgumentException(s"Invalid TableAction: $external")
    }
  }

  def isValid(external: String): Boolean =
    external match {
      case AddRow.external => true
      case EditCell.external => true
      case DeleteRow.external => true
      case _ => false
    }
  
}