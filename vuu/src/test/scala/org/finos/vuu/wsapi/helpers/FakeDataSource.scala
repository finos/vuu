package org.finos.vuu.wsapi.helpers

import scala.collection.immutable.ListMap


/* Using list map to preserve the order of the row data
*/

class FakeDataSource(rows: ListMap[String, Map[String, Any]]) {
  type RowKey = String
  type ColumnName = String

  def get(): ListMap[RowKey, Map[ColumnName, Any]] = {
    rows
  }
  
  def size(): Int = rows.size
  
}
