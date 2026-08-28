package org.finos.vuu.wsapi.helpers

import org.finos.vuu.api.{ColumnBuilder, TableDef, TableDefOptions}
import org.finos.vuu.core.AbstractVuuServer
import org.finos.vuu.core.table.{Column, DataTable}

import scala.collection.immutable.ListMap

object TestTable {

  val columns: Array[Column] = new ColumnBuilder()
    .addString("Id")
    .addString("Name")
    .addInt("Account")
    .build()

  val dataSource = new FakeDataSource(ListMap(
    "row1" -> Map("Id" -> "row1", "Name" -> "Becky Thatcher", "Account" -> 123),
    "row2" -> Map("Id" -> "row2", "Name" -> "Tom Sawyer", "Account" -> 456),
    "row3" -> Map("Id" -> "row3", "Name" -> "Huckleberry Finn", "Account" -> 789),
  ))

  val largeDataSource = new FakeDataSource(ListMap(
    "row1" -> Map("Id" -> "row1", "Name" -> "user1", "Account" -> 1),
    "row2" -> Map("Id" -> "row2", "Name" -> "user2", "Account" -> 2),
    "row3" -> Map("Id" -> "row3", "Name" -> "user3", "Account" -> 3),
    "row4" -> Map("Id" -> "row4", "Name" -> "user4", "Account" -> 4),
    "row5" -> Map("Id" -> "row5", "Name" -> "user5", "Account" -> 5),
    "row6" -> Map("Id" -> "row6", "Name" -> "user6", "Account" -> 6),
    "row7" -> Map("Id" -> "row7", "Name" -> "user7", "Account" -> 7),
    "row8" -> Map("Id" -> "row8", "Name" -> "user8", "Account" -> 8),
    "row9" -> Map("Id" -> "row9", "Name" -> "user9", "Account" -> 9),
    "row10" -> Map("Id" -> "row10", "Name" -> "user10", "Account" -> 10),
    "row11" -> Map("Id" -> "row11", "Name" -> "user11", "Account" -> 11),
    "row12" -> Map("Id" -> "row12", "Name" -> "user12", "Account" -> 12),
    "row13" -> Map("Id" -> "row13", "Name" -> "user13", "Account" -> 13),
    "row14" -> Map("Id" -> "row14", "Name" -> "user14", "Account" -> 14),
    "row15" -> Map("Id" -> "row15", "Name" -> "user15", "Account" -> 15),
  ))

  def createTableDef(tableName: String): TableDef = {
    TableDef(
      name = tableName,
      keyField = "Id",
      customColumns = columns
    )
  }

  def createTableDef(tableName: String, isEditable: Boolean): TableDef = {
    TableDef(
      name = tableName,
      keyField = "Id",
      customColumns = columns,
      options = TableDefOptions(
        isEditable = isEditable
      )
    )
  }
}
