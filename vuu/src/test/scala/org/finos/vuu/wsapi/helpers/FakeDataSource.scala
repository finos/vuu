package org.finos.vuu.wsapi.helpers

class FakeDataSource(rows: Map[String, Map[String, Any]]) {
  type RowKey = String
  type ColumnName = String

  def get(): Map[RowKey, Map[ColumnName, Any]] = {
    rows
  }
}
