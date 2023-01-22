package org.finos.vuu.viewport

import org.finos.vuu.core.table.Column

class ViewPortColumns(sourceColumns: List[Column]){

    @volatile private var columns: List[Column] = sourceColumns

    def addColumn(column: Column): Unit = {
      columns = columns ++ List(column)
    }

    def getColumns(): List[Column] = columns

    def getColumnForName(name: String): Option[Column] = {
      columns.find(_.name == name)
    }

    def count(): Int = columns.size
}
