package org.finos.vuu.core.sort

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.net.SortSpec
import org.finos.vuu.viewport.ViewPortColumns

object SortSpecParser extends StrictLogging {

  def parse(sortSpec: SortSpec, vpColumns: ViewPortColumns): Sort = {
    if (sortSpec != null && sortSpec.sortDefs != null && sortSpec.sortDefs.nonEmpty)
      Sort(sortSpec, sortSpec.sortDefs.map(sd => vpColumns.getColumnForName(sd.column).get))
    else
      NoSort
  }

}
