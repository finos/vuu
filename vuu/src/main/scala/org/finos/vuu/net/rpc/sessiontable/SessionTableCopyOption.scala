package org.finos.vuu.net.rpc.sessiontable

enum SessionTableCopyOption(val name: String) {
  case All extends SessionTableCopyOption("All")
  case Selected extends SessionTableCopyOption("Selected")
  case Empty extends SessionTableCopyOption("None")
}

object SessionTableCopyOption {

  private val copyOptionByName = SessionTableCopyOption.values.map(f => f.name -> f).toMap

  def fromString(s: String): SessionTableCopyOption = {
    s match {
      case null => Empty
      case _ => copyOptionByName.getOrElse(s, Empty)
    }
  }

  val ALL: SessionTableCopyOption = SessionTableCopyOption.All
  val SELECTED: SessionTableCopyOption = SessionTableCopyOption.Selected
  val EMPTY: SessionTableCopyOption = SessionTableCopyOption.Empty

}
