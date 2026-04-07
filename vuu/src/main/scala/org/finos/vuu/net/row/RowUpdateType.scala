package org.finos.vuu.net.row

import org.finos.vuu.core.sort.SortDirection.{Ascending, Descending}

enum RowUpdateType(val external: String) {
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
  
}