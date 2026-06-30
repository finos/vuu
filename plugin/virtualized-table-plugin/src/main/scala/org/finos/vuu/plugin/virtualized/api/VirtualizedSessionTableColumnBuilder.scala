package org.finos.vuu.plugin.virtualized.api

import scala.collection.mutable

class VirtualizedSessionTableColumnBuilder {

  val columns = new mutable.ArrayBuilder.ofRef[String]()

  def addString(columnName: String): VirtualizedSessionTableColumnBuilder = {
    addString(columnName, columnName)
  }

  def addString(columnName: String, remoteName: String): VirtualizedSessionTableColumnBuilder = {
    columns += s"$columnName:String:$remoteName"
    this
  }

  def addDouble(columnName: String): VirtualizedSessionTableColumnBuilder = {
    addDouble(columnName, columnName)
  }

  def addDouble(columnName: String, remoteName: String): VirtualizedSessionTableColumnBuilder = {
    columns += s"$columnName:Double:$remoteName"
    this
  }

  def addInt(columnName: String): VirtualizedSessionTableColumnBuilder = {
    addInt(columnName, columnName)
  }

  def addInt(columnName: String, remoteName: String): VirtualizedSessionTableColumnBuilder = {
    columns += s"$columnName:Int:$remoteName"
    this
  }

  def addLong(columnName: String): VirtualizedSessionTableColumnBuilder = {
    addLong(columnName, columnName)
  }

  def addLong(columnName: String, remoteName: String): VirtualizedSessionTableColumnBuilder = {
    columns += s"$columnName:Long:$remoteName"
    this
  }

  def addBoolean(columnName: String): VirtualizedSessionTableColumnBuilder = {
    addBoolean(columnName, columnName)
  }

  def addBoolean(columnName: String, remoteName: String): VirtualizedSessionTableColumnBuilder = {
    columns += s"$columnName:Boolean:$remoteName"
    this
  }

  def addChar(columnName: String): VirtualizedSessionTableColumnBuilder = {
    addChar(columnName, columnName)
  }

  def addChar(columnName: String, remoteName: String): VirtualizedSessionTableColumnBuilder = {
    columns += s"$columnName:Char:$remoteName"
    this
  }

  def addEpochTimestamp(columnName: String): VirtualizedSessionTableColumnBuilder = {
    addEpochTimestamp(columnName, columnName)
  }

  def addEpochTimestamp(columnName: String, remoteName: String): VirtualizedSessionTableColumnBuilder = {
    columns += s"$columnName:EpochTimestamp:$remoteName"
    this
  }

  def addScaledDecimal2(columnName: String): VirtualizedSessionTableColumnBuilder = {
    addScaledDecimal2(columnName, columnName)
  }

  def addScaledDecimal2(columnName: String, remoteName: String): VirtualizedSessionTableColumnBuilder = {
    columns += s"$columnName:ScaledDecimal2:$remoteName"
    this
  }

  def addScaledDecimal4(columnName: String): VirtualizedSessionTableColumnBuilder = {
    addScaledDecimal4(columnName, columnName)
  }

  def addScaledDecimal4(columnName: String, remoteName: String): VirtualizedSessionTableColumnBuilder = {
    columns += s"$columnName:ScaledDecimal4:$remoteName"
    this
  }

  def addScaledDecimal6(columnName: String): VirtualizedSessionTableColumnBuilder = {
    addScaledDecimal6(columnName, columnName)
  }

  def addScaledDecimal6(columnName: String, remoteName: String): VirtualizedSessionTableColumnBuilder = {
    columns += s"$columnName:ScaledDecimal6:$remoteName"
    this
  }

  def addScaledDecimal8(columnName: String): VirtualizedSessionTableColumnBuilder = {
    addScaledDecimal8(columnName, columnName)
  }

  def addScaledDecimal8(columnName: String, remoteName: String): VirtualizedSessionTableColumnBuilder = {
    columns += s"$columnName:ScaledDecimal8:$remoteName"
    this
  }

  def build(): Array[VirtualizedSessionTableColumn] =
    VirtualizedSessionTableColumn.fromNames(columns.result())

}
