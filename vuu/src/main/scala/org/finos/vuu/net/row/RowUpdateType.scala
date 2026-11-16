package org.finos.vuu.net.row

enum RowUpdateType(val external: String) extends java.lang.Enum[RowUpdateType] {
  case SizeOnly extends RowUpdateType("SIZE")
  case Update extends RowUpdateType("U")
}

object RowUpdateType {

  def fromExternal(external: String): RowUpdateType = {
    external match {
      case SizeOnly.external => SizeOnly
      case Update.external => Update
      case _ => throw new IllegalArgumentException(s"Invalid row update type: $external")
    }
  }

  def isValid(external: String): Boolean =
    external match {
      case SizeOnly.external => true
      case Update.external => true
      case _ => false
    }
  
}