package org.finos.vuu.core.sort

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.net.SortSpec
import org.finos.vuu.viewport.ViewPortColumns

object SortSpecParser extends StrictLogging {

  def parse(inputSpec: SortSpec, vpColumns: ViewPortColumns): Sort = {
    if (inputSpec != null && inputSpec.sortDefs != null) {
      val validSpec = createValidSpec(inputSpec, vpColumns)
      createSort(validSpec, vpColumns)
    } else {
      NoSort
    }
  }

  private def createValidSpec(inputSpec: SortSpec, vpColumns: ViewPortColumns): SortSpec = {
    val validSpec = SortSpec(inputSpec.sortDefs.filter(f => vpColumns.columnExists(f.column) && SortDirection.isValid(f.sortType)))
    if (validSpec.sortDefs.length != inputSpec.sortDefs.length) {
      val discarded = inputSpec.sortDefs.filterNot(validSpec.sortDefs.contains)
      logger.warn(s"Discarding invalid sort definitions: $discarded")
    }
    validSpec
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
