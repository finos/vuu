package org.finos.vuu.feature

import org.finos.vuu.core.filter.Filter
import org.finos.vuu.core.sort.Sort
import org.finos.vuu.core.table.DataTable

/**
 * The Viewport Keys Creator takes in a source table, a sort and a filter
 * and generates ViewPortKeys object.
 */
trait ViewPortKeysCreator {
  def createKeys(table: DataTable, sort: Sort, filter: Filter): ViewPortKeys
}
