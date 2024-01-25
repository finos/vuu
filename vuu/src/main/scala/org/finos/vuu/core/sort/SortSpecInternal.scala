package org.finos.vuu.core.sort

import org.finos.vuu.core.sort.ModelType.SortSpecInternal
import org.finos.vuu.net.SortSpec

object ModelType{
  type SortSpecInternal = Map[String, SortDirection.TYPE]
}
object SortSpecInternalFactory {
  def create(apiSpec: SortSpec): SortSpecInternal =
    apiSpec.sortDefs
      .map(s => (s.column, convertDirectionType(s.sortType))).toMap

  private def convertDirectionType(external:SortDirectionExternal.TYPE) : SortDirection.TYPE =
    external match {
      case SortDirectionExternal.Ascending => SortDirection.Ascending
      case SortDirectionExternal.Descending => SortDirection.Descending
      //todo handle unsupported input
    }
}

object SortDirectionExternal {
  type TYPE = Char
  final val Descending: Char = 'D'
  final val Ascending: Char = 'A'
}