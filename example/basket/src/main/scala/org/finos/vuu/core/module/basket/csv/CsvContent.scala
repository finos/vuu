package org.finos.vuu.core.module.basket.csv

class CsvContent(data: Array[Array[String]]) {

  private val header = data(0)
  val dataRows: Array[Array[String]] = data.tail

  def getValue(headerName: String, row: Array[String]) = {
    val index = header.indexOf(headerName)
    if (row.length > index && index > -1) row(index) else null
  }

  def getValueAsDouble(headerName: String, row: Array[String], defaultValue: Double) = {
    val x = getValue(headerName, row)
    if (x == null) defaultValue else x.toDouble
  }
}
