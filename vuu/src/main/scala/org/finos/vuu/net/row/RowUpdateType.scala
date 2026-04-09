package org.finos.vuu.net.row

enum RowUpdateType(val external: String) {
  case SizeOnly extends RowUpdateType("SIZE")
  case Update extends RowUpdateType("U")
}

object RowUpdateType {

  //Java consumers
  val SIZE_ONLY: RowUpdateType = RowUpdateType.SizeOnly
  val UPDATE: RowUpdateType = RowUpdateType.Update

  def fromExternal(external: String): RowUpdateType = {
    external match {
      case SizeOnly.external => SizeOnly
      case Update.external => Update
      case _ => throw new IllegalArgumentException(s"Invalid row update type: $external")
    }
  }
  
}