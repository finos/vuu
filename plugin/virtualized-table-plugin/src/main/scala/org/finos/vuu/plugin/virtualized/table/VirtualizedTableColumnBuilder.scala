package org.finos.vuu.plugin.virtualized.table

import scala.collection.mutable

class VirtualizedTableColumnBuilder {

  val columns = new mutable.ArrayBuilder.ofRef[String]()

  def addString(columnName: String): VirtualizedTableColumnBuilder = {
    addString(columnName, columnName)
  }

  def addString(columnName: String, remoteName: String): VirtualizedTableColumnBuilder = {
    columns += s"$columnName:String:$remoteName"
    this
  }

  def addDouble(columnName: String): VirtualizedTableColumnBuilder = {
    addDouble(columnName, columnName)
  }

  def addDouble(columnName: String, remoteName: String): VirtualizedTableColumnBuilder = {
    columns += s"$columnName:Double:$remoteName"
    this
  }

  def addInt(columnName: String): VirtualizedTableColumnBuilder = {
    columns += (columnName + ":Int")
    this
  }

  def addLong(columnName: String): VirtualizedTableColumnBuilder = {
    columns += (columnName + ":Long")
    this
  }

  def addBoolean(columnName: String): VirtualizedTableColumnBuilder = {
    columns += (columnName + ":Boolean")
    this
  }

  def addChar(columnName: String): VirtualizedTableColumnBuilder = {
    columns += (columnName + ":Char")
    this
  }

  def addEpochTimestamp(columnName: String): VirtualizedTableColumnBuilder = {
    columns += (columnName + ":EpochTimestamp")
    this
  }

  def addScaledDecimal2(columnName: String): VirtualizedTableColumnBuilder = {
    columns += (columnName + ":ScaledDecimal2")
    this
  }

  def addScaledDecimal4(columnName: String): VirtualizedTableColumnBuilder = {
    columns += (columnName + ":ScaledDecimal4")
    this
  }

  def addScaledDecimal6(columnName: String): VirtualizedTableColumnBuilder = {
    columns += (columnName + ":ScaledDecimal6")
    this
  }

  def addScaledDecimal8(columnName: String): VirtualizedTableColumnBuilder = {
    columns += (columnName + ":ScaledDecimal8")
    this
  }

  def build(): Array[VirtualizedTableColumn] = VirtualizedTableColumn.fromNames(columns.result())

}
