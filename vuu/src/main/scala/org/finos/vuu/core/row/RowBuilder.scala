package org.finos.vuu.core.row

import org.finos.vuu.core.table.{Column, RowData}

trait RowBuilder {
  def setKey(key: String): RowBuilder
  def setLong(column: Column, v: Long): RowBuilder
  def setDouble(column: Column, v: Double): RowBuilder
  def setInt(column: Column, v: Int): RowBuilder
  def setString(column: Column, v: String): RowBuilder
  def setBoolean(column: Column, v: Boolean): RowBuilder
  def asRow: RowData
}
