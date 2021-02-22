package io.venuu.vuu.api

import io.venuu.vuu.core.table._

object Fields {
  val All = List("*")
}

object VisualLinks {
  def apply(link: Link*): VisualLinks = {
    new VisualLinks(link.toList)
  }
}

object Link {
  def apply(fromColumn: String, toTable: String, toField: String): Link = {
    new Link(fromColumn, toTable, toField)
  }
}

object TableDef {

  def apply(name: String, keyField: String, columns: Array[Column], links: VisualLinks, joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields.toSeq, links = links, indices = Indices())
  }

  def apply(name: String, keyField: String, columns: Array[Column], links: VisualLinks, indices: Indices, joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields.toSeq, links = links, indices = indices)
  }

  def apply(name: String, keyField: String, columns: Array[Column], indices: Indices, joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields.toSeq, indices = indices)
  }
  def apply(name: String, keyField: String, columns: Array[Column], joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields.toSeq, indices = Indices())
  }
}

object AutoSubscribeTableDef {
  def apply(name: String, keyField: String, columns: Array[Column], joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields.toSeq, autosubscribe = true, indices = Indices())
  }
}


object GroupByColumns {
  def addTo(columns: Array[Column]): Array[Column] = get(columns.length) ++ columns

  private def newBoolean(name: String, index: Int) = new SimpleColumn(name, index, DataType.fromString("boolean"))

  private def newColumn(name: String, index: Int) = new SimpleColumn(name, index, DataType.fromString("int"))

  private def newColumnStr(name: String, index: Int) = new SimpleColumn(name, index, DataType.fromString("string"))

  def get(origColumnSize: Int) =
    Array(
      newColumn("_depth", origColumnSize),
      newBoolean("_isOpen", origColumnSize + 1),
      newColumnStr("_treeKey", origColumnSize + 2),
      newBoolean("_isLeaf", origColumnSize + 3),
      newColumnStr("_caption", origColumnSize + 4),
      newColumn("_childCount", origColumnSize + 5)
    )
}

class GroupByTableDef(name: String, sourceTableDef: TableDef) extends TableDef(name, sourceTableDef.keyField, sourceTableDef.columns, Seq(), indices = Indices()) {
}

case class Link(fromColumn: String, toTable: String, toColumn: String)

case class VisualLinks(links: List[Link])
case class Indices(indices: Index*)
case class Index(column: String)


case class AvailableViewPortVisualLink(parentVpId: String, link: Link){
  override def toString: String = link.fromColumn + " to " + link.toTable + "." + link.toColumn
}

class TableDef(val name: String, val keyField: String, val columns: Array[Column], val joinFields: Seq[String],
               val autosubscribe: Boolean = false,
               val links: VisualLinks = VisualLinks(),
               val indices: Indices) {

  def deleteColumnName() = s"$name._isDeleted"

  def columnForName(name: String): Column = {
    val column = columns.find(c => c.name == name)
    if (column.isEmpty)
      null
    else
      column.get
  }

  def columnExists(name: String): Boolean = {
    columns.find(_.name == name).isDefined
  }

  def fullyQuallifiedColumnName(column: String): String = s"$name.$column"

}

trait JoinType

object LeftOuterJoin extends JoinType

object InnerJoin extends JoinType


case class JoinSpec(left: String, right: String, joinType: JoinType = InnerJoin)

case class JoinTo(table: TableDef, joinSpec: JoinSpec)

case class JoinTableDef(override val name: String, baseTable: TableDef, joinColumns: Array[Column], override val joinFields: Seq[String], joins: JoinTo*) extends TableDef(name, baseTable.keyField, joinColumns, joinFields, indices = Indices()) {

  lazy val joinTableColumns = getJoinDefinitionColumnsInternal()
  lazy val rightTables = joins.map(join => join.table.name).toArray
  lazy val joinFieldNames = getJoinDefinitionColumns().map(_.name)
  lazy val joinTableNames = (1 to baseTable.joinFields.size).map(i => baseTable.name) ++ rightTables

  def getJoinDefinitionColumns(): Array[Column] = joinTableColumns

  private def getJoinDefinitionColumnsInternal(): Array[Column] = {

    val baseColumns = Columns.from(baseTable, baseTable.joinFields)

    val startIndex = baseColumns.size - 1
    val endIndex = startIndex + joins.toArray.size - 1

    val joinFieldColumns = joins.toArray.zip(startIndex to endIndex).map({ case (join, index) => {
      val baseColumn = join.table.columnForName(join.joinSpec.right)
      new JoinColumn(baseColumn.name, index, baseColumn.dataType, join.table, baseColumn)
    }
    })

    baseColumns ++ joinFieldColumns
  }
}

//case class JoinTableDef(override val name: String, left: TableDef, right: TableDef, joinDef: JoinDefinition, joinColumns: Array[Column]) extends TableDef(name, joinDef.leftKeyField, joinColumns){
//  def getJoinDefinitionColumns():Array[Column] = {
//     Array(columnForName(left.keyField), columnForName(joinDef.rightKeyField))
//  }
//}
