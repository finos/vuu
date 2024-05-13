package org.finos.vuu.api

import org.finos.vuu.core.table.{Column, Columns}

import scala.collection.mutable.ArrayBuilder

class ColumnBuilder {

  val columns = new ArrayBuilder.ofRef[String]()

  def addString(columnName: String): ColumnBuilder = {
    columns += (columnName + ":String")
    this
  }

  def addDouble(columnName: String): ColumnBuilder = {
    columns += (columnName + ":Double")
    this
  }

  def addInt(columnName: String): ColumnBuilder = {
    columns += (columnName + ":Int")
    this
  }

  def addLong(columnName: String): ColumnBuilder = {
    columns += (columnName + ":Long")
    this
  }

  def build(): Array[Column] = Columns.fromNames(columns.result())
}
