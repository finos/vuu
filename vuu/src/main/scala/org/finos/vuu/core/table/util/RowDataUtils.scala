package org.finos.vuu.core.table.util

import org.finos.vuu.core.table.{RowData, RowWithData}

import scala.runtime.RichLong

object RowDataUtils {

  def getRequiredLong(rowData: RowData, columnName: String): Long = {
    safeGet(rowData, columnName) match {
      case value: RichLong => value.longValue
      case value: Long => value
      case _ => throw new RowDataException(s"$columnName is not present or is not a Long")
    }
  }

  def getRequiredString(rowData: RowData, columnName: String): String = {
    safeGet(rowData, columnName) match {
      case value: String => value
      case _ => throw new RowDataException(s"$columnName is not present or is not a String")
    }
  }

  def getString(rowData: RowData, columnName: String): String = {
    safeGet(rowData, columnName) match {
      case value: String => value
      case _ => null
    }
  }

  private def safeGet(rowData: RowData, columnName: String): Any = {
    if (rowData != null && columnName != null) {
      return rowData.get(columnName) match {
        case option: Option[_] => option.orNull
        case value => value
      }
    }
    null
  }

  final class RowDataException(message: String)
    extends RuntimeException
}