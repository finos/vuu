package org.finos.vuu.api

import org.finos.vuu.core.table.{Column, Columns}

import scala.collection.mutable

class ColumnBuilder {

  val columns = new mutable.ArrayBuilder.ofRef[String]()

  def addString(columnName: String): ColumnBuilder = {
    addString(columnName, false)
  }

  def addString(columnName: String, isEditable: Boolean): ColumnBuilder = {
    columns += (columnName + ":String:" + isEditable)
    this
  }

  def addDouble(columnName: String): ColumnBuilder = {
    addDouble(columnName, false)
  }

  def addDouble(columnName: String, isEditable: Boolean): ColumnBuilder = {
    columns += (columnName + ":Double:" + isEditable)
    this
  }

  def addInt(columnName: String): ColumnBuilder = {
    addInt(columnName, false)
  }

  def addInt(columnName: String, isEditable: Boolean): ColumnBuilder = {
    columns += (columnName + ":Int:" + isEditable)
    this
  }

  def addLong(columnName: String): ColumnBuilder = {
    addLong(columnName, false)
  }

  def addLong(columnName: String, isEditable: Boolean): ColumnBuilder = {
    columns += (columnName + ":Long:" + isEditable)
    this
  }

  def addBoolean(columnName: String): ColumnBuilder = {
    addBoolean(columnName, false)
  }

  def addBoolean(columnName: String, isEditable: Boolean): ColumnBuilder = {
    columns += (columnName + ":Boolean:" + isEditable)
    this
  }

  def addChar(columnName: String): ColumnBuilder = {
    addChar(columnName, false)
  }

  def addChar(columnName: String, isEditable: Boolean): ColumnBuilder = {
    columns += (columnName + ":Char:" + isEditable)
    this
  }

  def addEpochTimestamp(columnName: String): ColumnBuilder = {
    addEpochTimestamp(columnName, false)
  }

  def addEpochTimestamp(columnName: String, isEditable: Boolean): ColumnBuilder = {
    columns += (columnName + ":EpochTimestamp:" + isEditable)
    this
  }

  def addScaledDecimal2(columnName: String): ColumnBuilder = {
    addScaledDecimal2(columnName, false)
  }

  def addScaledDecimal2(columnName: String, isEditable: Boolean): ColumnBuilder = {
    columns += (columnName + ":ScaledDecimal2:" + isEditable)
    this
  }

  def addScaledDecimal4(columnName: String): ColumnBuilder = {
    addScaledDecimal4(columnName, false)
  }

  def addScaledDecimal4(columnName: String, isEditable: Boolean): ColumnBuilder = {
    columns += (columnName + ":ScaledDecimal4:" + isEditable)
    this
  }

  def addScaledDecimal6(columnName: String): ColumnBuilder = {
    addScaledDecimal6(columnName, false)
  }

  def addScaledDecimal6(columnName: String, isEditable: Boolean): ColumnBuilder = {
    columns += (columnName + ":ScaledDecimal6:" + isEditable)
    this
  }

  def addScaledDecimal8(columnName: String): ColumnBuilder = {
    addScaledDecimal8(columnName, false)
  }

  def addScaledDecimal8(columnName: String, isEditable: Boolean): ColumnBuilder = {
    columns += (columnName + ":ScaledDecimal8:" + isEditable)
    this
  }

  def build(): Array[Column] = Columns.fromNames(columns.result())
}


