package org.finos.vuu.viewport

import org.finos.vuu.core.table.{CalculatedColumn, Column, RowData, RowWithData, ViewPortColumnCreator}

trait ViewPortColumns {
  def columnExists(name: String): Boolean
  def getColumns(): List[Column]
  def getColumnForName(name: String): Option[Column]
  def count(): Int
  def hasCalculatedColumn(): Boolean
  def pullRow(key: String, row: RowData): RowData
  def pullRowAlwaysFilter(key: String, row: RowData): RowData
}

object ViewPortColumns {

  def apply(): ViewPortColumns = ViewPortColumnsImpl(List())

  def apply(columns: List[Column]): ViewPortColumns = {
    ViewPortColumnsImpl(columns)
  }

}

private case class ViewPortColumnsImpl(sourceColumns: List[Column]) extends ViewPortColumns {

  override def columnExists(name: String): Boolean = {
    getColumns().exists(_.name == name)
  }

  override def getColumns(): List[Column] = sourceColumns

  override def getColumnForName(name: String): Option[Column] = {
    val evaluatedName = getEvaluatedName(name)
    getColumns().find(_.name == evaluatedName)
  }

  private def getEvaluatedName(name: String): String = {
    if (ViewPortColumnCreator.isCalculatedColumn(name)) {
      val (calcName, _, _) = ViewPortColumnCreator.parseCalcColumn(name)
      calcName
    } else {
      name
    }
  }

  override def count(): Int = getColumns().size

  private lazy val hasCalcColumn = sourceColumns.exists(c => c.isInstanceOf[CalculatedColumn])

  override def hasCalculatedColumn(): Boolean = hasCalcColumn

  override def pullRow(key: String, row: RowData): RowData = {
    if (!hasCalculatedColumn()) {
      row
    } else {
      this.pullRowAlwaysFilter(key, row)
    }
  }

  override def pullRowAlwaysFilter(key: String, row: RowData): RowData = {
    val rowData = this.getColumns().map(c => c.name -> row.get(c)).toMap
    RowWithData(key, rowData)
  }

  private lazy val hash: Int = sourceColumns.hashCode()

  override def hashCode(): Int = hash

  override def equals(obj: Any): Boolean = obj match {
    case that: ViewPortColumnsImpl => that.sourceColumns == sourceColumns
    case _ => false
  }
}
