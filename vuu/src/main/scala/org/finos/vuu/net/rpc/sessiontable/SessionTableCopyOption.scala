package org.finos.vuu.net.rpc.sessiontable

enum SessionTableCopyOption(val name: String) {
  case All extends SessionTableCopyOption("All")
  case Selected extends SessionTableCopyOption("Selected")
  case Empty extends SessionTableCopyOption("None")
}

object SessionTableCopyOption {

  def fromString(s: String): SessionTableCopyOption = {
    SessionTableCopyOption.values.find(_.name == s).getOrElse(Empty)
  }

  val ALL: SessionTableCopyOption = SessionTableCopyOption.All
  val SELECTED: SessionTableCopyOption = SessionTableCopyOption.Selected
  val EMPTY: SessionTableCopyOption = SessionTableCopyOption.Empty

}
