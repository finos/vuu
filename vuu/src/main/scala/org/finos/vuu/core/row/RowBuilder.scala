package org.finos.vuu.core.row

import org.finos.vuu.core.table.{Column, RowData}

trait RowBuilder {
  def setKey(key: String): RowBuilder
  def setLong(column: Column, v: Long): RowBuilder
  def setDouble(column: Column, v: Double): RowBuilder
  def setInt(column: Column, v: Int): RowBuilder
  def setString(column: Column, v: String): RowBuilder
  def setBoolean(column: Column, v: Boolean): RowBuilder
  /**
   * this metyhod effectively resets the builder, emptying its existing contents to begin again.
   * @return row with data set
   */
  def asRow: RowData
}

object NoRowBuilder extends RowBuilder{
  override def setKey(key: String): RowBuilder = ???
  override def setLong(column: Column, v: Long): RowBuilder = ???
  override def setDouble(column: Column, v: Double): RowBuilder = ???
  override def setInt(column: Column, v: Int): RowBuilder = ???
  override def setString(column: Column, v: String): RowBuilder = ???
  override def setBoolean(column: Column, v: Boolean): RowBuilder = ???
  /**
   * this metyhod effectively resets the builder, emptying its existing contents to begin again.
   *
   * @return row with data set
   */
  override def asRow: RowData = ???
}
