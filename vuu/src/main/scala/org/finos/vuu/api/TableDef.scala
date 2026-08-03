package org.finos.vuu.api

import org.finos.vuu.core.filter.`type`.PermissionFilter
import org.finos.vuu.core.module.ViewServerModule
import org.finos.vuu.core.table.{Column, Columns, DataType, DefaultColumn, JoinColumn, SimpleColumn, TableContainer}
import org.finos.vuu.feature.inmem.VuuInMemPluginLocator
import org.finos.vuu.viewport.ViewPort

object Fields {
  val All: List[String] = List("*")
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

object GroupByColumns {
  def addTo(columns: Array[Column]): Array[Column] = get(columns.length) ++ columns

  private def newBoolean(name: String, index: Int) = SimpleColumn(name, index, DataType.fromString("boolean"))

  private def newColumn(name: String, index: Int) = SimpleColumn(name, index, DataType.fromString("int"))

  private def newColumnStr(name: String, index: Int) = SimpleColumn(name, index, DataType.fromString("string"))

  def get(origColumnSize: Int): Array[SimpleColumn] =
    Array(
      newColumn("_depth", origColumnSize),
      newBoolean("_isOpen", origColumnSize + 1),
      newColumnStr("_treeKey", origColumnSize + 2),
      newBoolean("_isLeaf", origColumnSize + 3),
      newColumnStr("_caption", origColumnSize + 4),
      newColumn("_childCount", origColumnSize + 5)
    )
}

class GroupByTableDef(name: String, sourceTableDef: TableDef)
  extends TableDef(name, sourceTableDef.keyField, sourceTableDef.customColumns,
    sourceTableDef.options)

case class Link(fromColumn: String, toTable: String, toColumn: String)

case class VisualLinks(links: List[Link])

case class Indices(indices: Index*)

case class Index(column: String)

case class IndexFilePath(path: String)

trait CleanupPolicy

object DeleteIndexOnShutdown extends CleanupPolicy

object PreserveIndexOnShutdown extends CleanupPolicy

case class AvailableViewPortVisualLink(parentVpId: String, link: Link) {
  override def toString: String = "(" + parentVpId.split("-").last + ")" + link.fromColumn + " to " + link.toTable + "." + link.toColumn
}

class SessionTableDef(override val name: String,
                      override val keyField: String,
                      override val customColumns: Array[Column],
                      override val options: BaseTableDefOptions = TableDefOptions()
                     ) extends TableDef(name, keyField, customColumns, options) with VuuInMemPluginLocator

class TableDef(val name: String,
               val keyField: String,
               val customColumns: Array[Column],
               val options: BaseTableDefOptions = TableDefOptions()
               ) extends VuuInMemPluginLocator {

  private val defaultColumns: Array[Column] = if (options.includeDefaultColumns) DefaultColumn.getDefaultColumns(customColumns) else Array.empty
  private val columns: Array[Column] = if (options.includeDefaultColumns) customColumns ++ defaultColumns else customColumns
  private val columnsByName: Map[String, Column] = getColumns.map(c => c.name -> c).toMap
  private val deletedColumnName: String = s"$name._isDeleted"
  private var module: ViewServerModule = null

  val defaultColumnNames: Set[String] = defaultColumns.map(v => v.name).toSet

  def permissionFilter(viewPort: ViewPort, tableContainer: TableContainer): PermissionFilter = {
    options.permissionFunction.apply(viewPort, tableContainer)
  }

  def deleteColumnName(): String = deletedColumnName

  def getColumns: Array[Column] = columns

  def columnForName(name: String): Column = {
    columnsByName.getOrElse(name, null)
  }

  def columnExists(name: String): Boolean = {
    columnsByName.contains(name)
  }

  def fullyQuallifiedColumnName(column: String): String = s"$name.$column"

  def setModule(module: ViewServerModule) = {
    this.module = module
  }

  def getModule(): ViewServerModule = this.module

}

trait JoinType

object LeftOuterJoin extends JoinType {
  override def toString: String = "LeftOuterJoin"
}

case class JoinSpec(left: String, right: String, joinType: JoinType = LeftOuterJoin)

case class JoinTo(table: TableDef, joinSpec: JoinSpec)

case class JoinTableDef(override val name: String,
                        joinOptions: JoinTableDefOptions,
                        baseTable: TableDef,
                        joinColumns: Array[Column],
                        joins: JoinTo*) extends TableDef(name, baseTable.keyField, joinColumns, joinOptions) with VuuInMemPluginLocator {

  lazy val joinTableColumns = getJoinDefinitionColumnsInternal()
  lazy val rightTables = joins.map(join => join.table.name).toArray
  lazy val joinFieldNames = getJoinDefinitionColumns().map(_.name)
  lazy val joinTableNames = (1 to baseTable.options.joinFields.size).map(i => baseTable.name) ++ rightTables

  override def toString: String = s"JoinTableDef(name=$name)"

  def getJoinDefinitionColumns(): Array[Column] = joinTableColumns

  def containsTable(tableName: String): Boolean = {
    if (baseTable.name == tableName) {
      true
    } else {
      rightTables.contains(tableName)
    }
  }

  def keyFieldForTable(tableName: String): String = {
    joins.find(joinTo => joinTo.table.name == tableName) match {
      case Some(joinTo: JoinTo) => joinTo.table.keyField
      case None => null
    }
  }

  def isLeftTable(tableName: String): Boolean = {
    this.baseTable.name == tableName
  }

  def isRightTable(tableName: String): Boolean = {
    this.rightTables.contains(tableName)
  }

  private def getJoinDefinitionColumnsInternal(): Array[Column] = {

    val baseColumns = Columns.from(baseTable, baseTable.options.joinFields)

    val startIndex = baseColumns.size - 1
    val endIndex = startIndex + joins.toArray.size - 1

    val joinFieldColumns = joins.toArray.zip(startIndex to endIndex).map({ case (join, index) => {
      val baseColumn = join.table.columnForName(join.joinSpec.right)
      JoinColumn(baseColumn.name, index, baseColumn.dataType, join.table, baseColumn, isAlias = false)
    }
    })

    baseColumns ++ joinFieldColumns
  }
}
