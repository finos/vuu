package org.finos.vuu.core.sort

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.net.SortSpec
import org.finos.vuu.viewport.ViewPortColumns

object SortSpecParser extends StrictLogging {

  def parse(sortSpec: SortSpec, vpColumns: ViewPortColumns): Sort = {
    if (sortSpec != null && sortSpec.sortDefs != null) {
      val newSpec = SortSpec(sortSpec.sortDefs.filter(f => vpColumns.columnExists(f.column)))
      createSort(newSpec, vpColumns)
    } else
      NoSort
  }

  private def createSort(validSpec: SortSpec, vpColumns: ViewPortColumns): Sort = {
    if (validSpec.sortDefs.isEmpty) {
      NoSort
    } else {
      val columns = validSpec.sortDefs.map(f => vpColumns.getColumnForName(f.column).get)
      Sort(validSpec, columns)
    }
  }

}
