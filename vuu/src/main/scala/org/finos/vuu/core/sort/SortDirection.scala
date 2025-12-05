package org.finos.vuu.core.sort

enum SortDirection(val external: Char) {

  case Descending extends SortDirection('D')
  case Ascending extends SortDirection('A')

}

object SortDirection {

  def fromExternal(external: Char): SortDirection =
    external match {
      case Descending.external => Descending
      case Ascending.external => Ascending
      case _ => throw new IllegalArgumentException(s"Invalid sort direction: $external")
    }

  def isValid(external: Char): Boolean =
    external match {
      case Descending.external => true
      case Ascending.external => true
      case _ => false
    }
  
}