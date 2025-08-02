package org.finos.vuu.api

import org.finos.vuu.core.table.{Column, Columns}

import scala.collection.mutable

class ColumnBuilder {

  val columns = new mutable.ArrayBuilder.ofRef[String]()

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

  def addBoolean(columnName: String): ColumnBuilder = {
    columns += (columnName + ":Boolean")
    this
  }

  def addChar(columnName: String): ColumnBuilder = {
    columns += (columnName + ":Char")
    this
  }

  def addEpochTimestamp(columnName: String): ColumnBuilder = {
    columns += (columnName + ":EpochTimestamp")
    this
  }

  def addDecimal(columnName: String, scale: Short): ColumnBuilder = {
    columns += (columnName + ":Decimal" + scale)
    this
  }

  def build(): Array[Column] = Columns.fromNames(columns.result())
}


