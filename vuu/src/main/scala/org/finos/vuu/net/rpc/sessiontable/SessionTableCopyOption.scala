package org.finos.vuu.net.rpc.sessiontable

enum SessionTableCopyOption(val external: String) extends java.lang.Enum[SessionTableCopyOption] {
  case All extends SessionTableCopyOption("All")
  case Selected extends SessionTableCopyOption("Selected")
  case Empty extends SessionTableCopyOption("Empty")
}

object SessionTableCopyOption {

  def fromExternal(external: String): SessionTableCopyOption = {
    external match {
      case All.external => All
      case Selected.external => Selected
      case Empty.external => Empty
      case _ => throw new IllegalArgumentException(s"Invalid SessionTableCopyOption: $external")
    }
  }

  def isValid(external: String): Boolean =
    external match {
      case All.external => true
      case Selected.external => true
      case Empty.external => true
      case _ => false
    }

}
