package org.finos.vuu.viewport

import org.finos.vuu.core.table.{CalculatedColumn, Column, JoinColumn, RowData, RowWithData, ViewPortColumnCreator}

trait ViewPortColumns {
  def columnExists(name: String): Boolean
  def getColumns: List[Column]
  def getColumnForName(name: String): Option[Column]
  def hasJoinColumns: Boolean
  def getJoinColumnsByTable: Map[String, List[JoinColumn]]
  def getJoinViewPortColumns(sourceTable: String): ViewPortColumns
  def hasCalculatedColumns: Boolean
  def getCalculatedColumns: List[CalculatedColumn]
  def pullRow(key: String, row: RowData): RowData
  def pullRowAlwaysFilter(key: String, row: RowData): RowData
}

object ViewPortColumns {

  private final val emptyViewPortColumns = ViewPortColumnsImpl(List.empty)

  def apply(): ViewPortColumns = emptyViewPortColumns

  def apply(columns: List[Column]): ViewPortColumns = {
    ViewPortColumnsImpl(columns)
  }

}

private case class ViewPortColumnsImpl(sourceColumns: List[Column]) extends ViewPortColumns {

  private lazy val columnsByName: Map[String, Column] = sourceColumns.map(c => c.name -> c).toMap

  override def columnExists(name: String): Boolean = {
    columnsByName.contains(name)
  }

  override def getColumns: List[Column] = sourceColumns

  override def getColumnForName(name: String): Option[Column] = {
    val evaluatedName = getEvaluatedName(name)
    columnsByName.get(evaluatedName)
  }

  private def getEvaluatedName(name: String): String = {
    if (ViewPortColumnCreator.isCalculatedColumn(name)) {
      val (calcName, _, _) = ViewPortColumnCreator.parseCalcColumn(name)
      calcName
    } else {
      name
    }
  }

  private lazy val hasJoinColumn = sourceColumns.exists(_.isInstanceOf[JoinColumn])

  override def hasJoinColumns: Boolean = hasJoinColumn

  private lazy val joinColumnsByTable: Map[String, List[JoinColumn]] = {
    if (hasJoinColumn) {
      sourceColumns.filter(_.isInstanceOf[JoinColumn])
        .map(_.asInstanceOf[JoinColumn])
        .groupBy(_.sourceTable.name)
    } else {
      Map.empty
    }
  }

  override def getJoinColumnsByTable: Map[String, List[JoinColumn]] = joinColumnsByTable

  private lazy val joinViewPortColumns: Map[String, ViewPortColumns] = {
    if (hasJoinColumn) {
      joinColumnsByTable.view.mapValues(f => ViewPortColumnCreator.create(f.head.sourceTable, f.map(_.name))).toMap
    } else {
      Map.empty
    }
  }

  override def getJoinViewPortColumns(sourceTable: String): ViewPortColumns = joinViewPortColumns.getOrElse(sourceTable, ViewPortColumns())

  private lazy val hasCalculatedColumn: Boolean = sourceColumns.exists(_.isInstanceOf[CalculatedColumn])

  override def hasCalculatedColumns: Boolean = hasCalculatedColumn

  private lazy val calculatedColumns: List[CalculatedColumn] = {
    if (hasCalculatedColumn) {
      sourceColumns.filter(_.isInstanceOf[CalculatedColumn]).map(_.asInstanceOf[CalculatedColumn])
    } else {
      List.empty
    }
  }

  override def getCalculatedColumns: List[CalculatedColumn] = calculatedColumns

  override def pullRow(key: String, row: RowData): RowData = {
    if (!hasCalculatedColumns) {
      row
    } else {
      this.pullRowAlwaysFilter(key, row)
    }
  }

  override def pullRowAlwaysFilter(key: String, row: RowData): RowData = {
    val rowData = sourceColumns.map(c => c.name -> row.get(c)).toMap
    RowWithData(key, rowData)
  }

  private lazy val hash: Int = sourceColumns.hashCode()

  override def hashCode(): Int = hash

  override def equals(obj: Any): Boolean = obj match {
    case that: ViewPortColumnsImpl => that.sourceColumns == sourceColumns
    case _ => false
  }

}
