package org.finos.vuu.net.rpc

enum SessionTableCopyOption(val name: String) {
  case All extends SessionTableCopyOption("All")
  case Selected extends SessionTableCopyOption("Selected")
  case Empty extends SessionTableCopyOption("None")
}

object SessionTableCopyOption {
  def fromString(s: String): SessionTableCopyOption = {
    SessionTableCopyOption.values.find(_.name == s).getOrElse(Empty)
  }
}
