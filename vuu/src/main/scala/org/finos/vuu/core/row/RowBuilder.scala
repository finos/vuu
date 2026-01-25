package org.finos.vuu.core.row

import org.finos.vuu.core.table.datatype.EpochTimestamp
import org.finos.vuu.core.table.{Column, EmptyRowData, RowData}

trait RowBuilder {
  def setKey(key: String): RowBuilder
  def setLong(column: Column, v: Long): RowBuilder
  def setDouble(column: Column, v: Double): RowBuilder
  def setInt(column: Column, v: Int): RowBuilder
  def setString(column: Column, v: String): RowBuilder
  def setBoolean(column: Column, v: Boolean): RowBuilder
  def setEpochTimestamp(column: Column, v: EpochTimestamp): RowBuilder
  def setChar(column: Column, v: Char): RowBuilder
  def build: RowData
}

object NoRowBuilder extends RowBuilder {
  override def setKey(key: String): RowBuilder = this
  override def setLong(column: Column, v: Long): RowBuilder = this
  override def setDouble(column: Column, v: Double): RowBuilder = this
  override def setInt(column: Column, v: Int): RowBuilder = this
  override def setString(column: Column, v: String): RowBuilder = this
  override def setBoolean(column: Column, v: Boolean): RowBuilder = this
  override def setEpochTimestamp(column: Column, v: EpochTimestamp): RowBuilder = this
  override def setChar(column: Column, v: Char): RowBuilder = this
  override def build: RowData = EmptyRowData
}
