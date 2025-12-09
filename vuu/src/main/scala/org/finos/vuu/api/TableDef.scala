package org.finos.vuu.api

import org.finos.vuu.api.TableVisibility.Public
import org.finos.vuu.core.filter.`type`.{AllowAllPermissionFilter, PermissionFilter}
import org.finos.vuu.core.module.ViewServerModule
import org.finos.vuu.core.table.*
import org.finos.vuu.feature.inmem.VuuInMemPluginLocator
import org.finos.vuu.net.SortSpec
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

object SessionTableDef {
  def apply(name: String, keyField: String, columns: Array[Column], joinFields: String*): TableDef = {
    new SessionTableDef(name, keyField, columns, joinFields, indices = Indices())
  }
}

object JoinSessionTableDef {
  def apply(name: String, keyField: String, columns: Array[Column], joinFields: String*): TableDef = {
    null //new JoinSessionTableDef(name, keyField, columns, joinFields, indices = Indices())
  }
}

object TableDef {

  //links

  def apply(name: String, keyField: String, columns: Array[Column], links: VisualLinks, joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields, links = links, indices = Indices())
  }

  def apply(name: String, keyField: String, columns: Array[Column], links: VisualLinks,
            permissionFunction: (ViewPort, TableContainer) => PermissionFilter, joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields, links = links, indices = Indices(), permissionFunction = permissionFunction)
  }

  def apply(name: String, keyField: String, columns: Array[Column], links: VisualLinks, defaultSort: SortSpec, joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields, links = links, indices = Indices(), defaultSort = defaultSort)
  }

  def apply(name: String, keyField: String, columns: Array[Column], links: VisualLinks,
            permissionFunction: (ViewPort, TableContainer) => PermissionFilter, defaultSort: SortSpec,
            joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields, links = links, indices = Indices(),
      permissionFunction = permissionFunction, defaultSort = defaultSort)
  }

  //links + indices

  def apply(name: String, keyField: String, columns: Array[Column], links: VisualLinks, indices: Indices, joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields, links = links, indices = indices)
  }

  def apply(name: String, keyField: String, columns: Array[Column], links: VisualLinks, indices: Indices,
            permissionFunction: (ViewPort, TableContainer) => PermissionFilter, joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields, links = links, indices = indices, permissionFunction = permissionFunction)
  }

  def apply(name: String, keyField: String, columns: Array[Column], links: VisualLinks, indices: Indices,
            defaultSort: SortSpec, joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields, links = links, indices = indices, defaultSort = defaultSort)
  }

  def apply(name: String, keyField: String, columns: Array[Column], links: VisualLinks, indices: Indices,
            permissionFunction: (ViewPort, TableContainer) => PermissionFilter, defaultSort: SortSpec,
            joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields, links = links, indices = indices,
      permissionFunction = permissionFunction, defaultSort = defaultSort)
  }

  //links + indices + visibility

  def apply(name: String, keyField: String, columns: Array[Column], links: VisualLinks, indices: Indices, visibility: TableVisibility, joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields, links = links, indices = indices, visibility = visibility)
  }

  def apply(name: String, keyField: String, columns: Array[Column], links: VisualLinks, indices: Indices,
            permissionFunction: (ViewPort, TableContainer) => PermissionFilter, visibility: TableVisibility, joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields, links = links, indices = indices, visibility = visibility,
      permissionFunction = permissionFunction)
  }

  def apply(name: String, keyField: String, columns: Array[Column], links: VisualLinks, indices: Indices,
            defaultSort: SortSpec, visibility: TableVisibility, joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields, links = links, indices = indices, visibility = visibility,
      defaultSort = defaultSort)
  }

  //indices
  def apply(name: String, keyField: String, columns: Array[Column], indices: Indices, joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields, indices = indices)
  }

  def apply(name: String, keyField: String, columns: Array[Column], indices: Indices,
            permissionFunction: (ViewPort, TableContainer) => PermissionFilter, joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields, indices = indices, permissionFunction = permissionFunction)
  }

  def apply(name: String, keyField: String, columns: Array[Column], indices: Indices,
            defaultSort: SortSpec, joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields, indices = indices, defaultSort = defaultSort)
  }

  def apply(name: String, keyField: String, columns: Array[Column], indices: Indices,
            permissionFunction: (ViewPort, TableContainer) => PermissionFilter, defaultSort: SortSpec, joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields, indices = indices, permissionFunction = permissionFunction,
      defaultSort = defaultSort)
  }

  //indices + visibility

  def apply(name: String, keyField: String, columns: Array[Column], indices: Indices, visibility: TableVisibility, joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields, indices = indices, visibility = visibility)
  }

  //no extras
  def apply(name: String, keyField: String, columns: Array[Column], joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields, indices = Indices())
  }

  // just visibility
  def apply(name: String, keyField: String, columns: Array[Column], visibility: TableVisibility, joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields, indices = Indices(), visibility = visibility)
  }

}

object AutoSubscribeTableDef {
  def apply(name: String, keyField: String, columns: Array[Column], joinFields: String*): TableDef = {
    new TableDef(name, keyField, columns, joinFields, autosubscribe = true, indices = Indices())
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

class GroupByTableDef(name: String, sourceTableDef: TableDef) extends TableDef(name, sourceTableDef.keyField, sourceTableDef.getColumns, Seq(), indices = Indices()) {
}

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

class JoinSessionTableDef(name: String, baseTable: TableDef, joinColumns: Array[Column],
                          joinFields: Seq[String], joins: JoinTo*) extends JoinTableDef(name, visibility = Public, baseTable,
  joinColumns, links = VisualLinks(), joinFields, permissionFunction = (_,_) => AllowAllPermissionFilter,
  defaultSort = SortSpec(List.empty)) with VuuInMemPluginLocator

class SessionTableDef(name: String,
                      keyField: String,
                      customColumns: Array[Column],
                      joinFields: Seq[String],
                      autosubscribe: Boolean = false,
                      links: VisualLinks = VisualLinks(),
                      indices: Indices) extends TableDef(name, keyField, customColumns, joinFields, autosubscribe, links, indices) with VuuInMemPluginLocator


class TableDef(val name: String,
               val keyField: String,
               val customColumns: Array[Column],
               val joinFields: Seq[String],
               val autosubscribe: Boolean = false,
               val links: VisualLinks = VisualLinks(),
               val indices: Indices,
               val visibility: TableVisibility = Public,
               val includeDefaultColumns: Boolean = true,
               val permissionFunction: (ViewPort, TableContainer) => PermissionFilter = (_, _) => AllowAllPermissionFilter,
               val defaultSort: SortSpec = SortSpec(List.empty)) extends VuuInMemPluginLocator {

  private val defaultColumns: Array[Column] = if (includeDefaultColumns) DefaultColumn.getDefaultColumns(customColumns) else Array.empty
  private val columns: Array[Column] = if (includeDefaultColumns) customColumns ++ defaultColumns else customColumns
  private lazy val columnsByName: Map[String, Column] = columns.map(c => c.name -> c).toMap

  private var module: ViewServerModule = null

  def permissionFilter(viewPort: ViewPort, tableContainer: TableContainer): PermissionFilter = {
    permissionFunction.apply(viewPort, tableContainer)
  }

  def deleteColumnName() = s"$name._isDeleted"

  def getDefaultColumns: Array[Column] = defaultColumns
  
  def getColumns: Array[Column] = columns

  def columnForName(name: String): Column = {
    columnsByName.get(name).orNull
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

case class JoinTableDef(
                         override val name: String,
                         override val visibility: TableVisibility,
                         baseTable: TableDef,
                         joinColumns: Array[Column],
                         override val links: VisualLinks,
                         override val joinFields: Seq[String],
                         override val permissionFunction: (ViewPort, TableContainer) => PermissionFilter,
                         override val defaultSort: SortSpec,
                         joins: JoinTo*)
  extends TableDef(name, baseTable.keyField, joinColumns, joinFields, indices = Indices(), autosubscribe = false,
    visibility = visibility, permissionFunction = permissionFunction, defaultSort = defaultSort)
    with VuuInMemPluginLocator {

  lazy val joinTableColumns = getJoinDefinitionColumnsInternal()
  lazy val rightTables = joins.map(join => join.table.name).toArray
  lazy val joinFieldNames = getJoinDefinitionColumns().map(_.name)
  lazy val joinTableNames = (1 to baseTable.joinFields.size).map(i => baseTable.name) ++ rightTables

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

    val baseColumns = Columns.from(baseTable, baseTable.joinFields)

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

object JoinTableDef {

  def apply(name: String, baseTable: TableDef, joinColumns: Array[Column], links: VisualLinks,
            joinFields: Seq[String], joins: JoinTo): JoinTableDef = {
    new JoinTableDef(name, Public, baseTable, joinColumns, links, joinFields, (_,_) => AllowAllPermissionFilter,
      SortSpec(List.empty), joins)
  }

  def apply(name: String, baseTable: TableDef, joinColumns: Array[Column], links: VisualLinks,
            visibility: TableVisibility, joinFields: Seq[String], joins: JoinTo): JoinTableDef = {
    new JoinTableDef(name, visibility, baseTable, joinColumns, links, joinFields, (_,_) => AllowAllPermissionFilter,
      SortSpec(List.empty), joins)
  }

  def apply(name: String, baseTable: TableDef, joinColumns: Array[Column], links: VisualLinks,
            visibility: TableVisibility, permissionFunction: (ViewPort, TableContainer) => PermissionFilter,
            joinFields: Seq[String], joins: JoinTo): JoinTableDef = {
    new JoinTableDef(name, visibility, baseTable, joinColumns, links, joinFields, permissionFunction,
      SortSpec(List.empty), joins)
  }

  def apply(name: String, baseTable: TableDef, joinColumns: Array[Column], links: VisualLinks,
            visibility: TableVisibility, permissionFunction: (ViewPort, TableContainer) => PermissionFilter,
            joinFields: Seq[String], defaultSort: SortSpec, joins: JoinTo): JoinTableDef = {
    new JoinTableDef(name, visibility, baseTable, joinColumns, links, joinFields, permissionFunction,
      defaultSort, joins)
  }

  def apply(name: String, baseTable: TableDef, joinColumns: Array[Column], links: VisualLinks,
            defaultSort: SortSpec, joinFields: Seq[String], joins: JoinTo): JoinTableDef = {
    new JoinTableDef(name, Public, baseTable, joinColumns, links, joinFields, (_,_) => AllowAllPermissionFilter,
      defaultSort, joins)
  }

  def apply(name: String, baseTable: TableDef, joinColumns: Array[Column], links: VisualLinks,
            permissionFunction: (ViewPort, TableContainer) => PermissionFilter, joinFields: Seq[String], joins: JoinTo): JoinTableDef = {
    new JoinTableDef(name, Public, baseTable, joinColumns, links, joinFields, permissionFunction,
      SortSpec(List.empty), joins)
  }

}
