package org.finos.vuu.core.table

import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.column.CalculatedColumnFactory
import org.finos.vuu.viewport.ViewPortColumns

import scala.collection.mutable.ListBuffer

object ViewPortColumnCreator {

  def isCalculatedColumn(column: String): Boolean = {
    column.contains(':')
  }

  def parseCalcColumn(column: String): (String, String, String) = {
    assert(column.split(":").length == 3)
    val (name :: dataType :: definition :: _) = column.split(":").toList
    (name, dataType, definition)
  }

  def create(table: DataTable, columns: List[String]): ViewPortColumns = {
    create(table.getTableDef, columns)
  }

  def create(tableDef: TableDef, columns: List[String]): ViewPortColumns = {

    val vpColumns: ListBuffer[Column] = ListBuffer()

    columns.foreach( column => {
      if (isCalculatedColumn(column)) {
        val (name, dataType, definition) = parseCalcColumn(column)
        vpColumns.addOne(CalculatedColumnFactory.parse(vpColumns, name, dataType, definition))
      } else {
        vpColumns.addOne(tableDef.columnForName(column))
      }
    })

    ViewPortColumns(vpColumns.toList)
  }

}
