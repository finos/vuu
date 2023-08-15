package org.finos.vuu.core.table

import org.finos.vuu.core.table.column.CalculatedColumnFactory
import org.finos.vuu.viewport.ViewPortColumns
import org.finos.vuu.feature.spec.table.DataTable

object ViewPortColumnCreator {

  def create(table: DataTable, columns: List[String]): ViewPortColumns = {

    //val staticColumns = columns.map( col => table.getTableDef.columnForName(col)).toList

    val vpColumns = new ViewPortColumns(List())

    columns.foreach( column => {
      if (column.contains(':')) {
        assert(column.split(":").length == 3)
        val (name :: dataType :: definition :: _) = column.split(":").toList
        vpColumns.addColumn(CalculatedColumnFactory.parse(vpColumns, name, dataType, definition))
      } else {
        vpColumns.addColumn(table.getTableDef.columnForName(column))
      }
    })

    vpColumns
  }

}
