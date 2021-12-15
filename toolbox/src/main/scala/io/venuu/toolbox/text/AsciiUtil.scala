package io.venuu.toolbox.text

import scala.collection.mutable.ListBuffer

object AsciiUtil {

  private def computeWidths(headers: Array[String], data: Array[Array[Any]]): Array[Int] = {

    val widths = headers.map(_.length)

    var rowIx = 0

    while(rowIx < data.length){
      val row = data(rowIx)
      var colIx = 0

      while(colIx < widths.length){

        val cellLen = cellToString(row, colIx).length

        widths(colIx) = Math.max(cellLen, widths(colIx))

        colIx += 1
      }

      rowIx += 1

    }

    widths
  }

  def cellToString(row: Array[Any], col: Int): String = {
      cellValue(row, col).getOrElse("null")
  }

  def cellValue(row: Array[Any], col: Int): Option[String] = {
    if(col < row.length) {
      if(row(col) == null) None
      else
        Option(row(col).toString)
    }
    else None
  }

  def asAsciiTable(headers: Array[String], data: Array[Array[Any]]): String = {

    val buffer = new ListBuffer[String]

    val widths = computeWidths(headers, data)

    def padTo(s: String, i: Int) = s.padTo(i, " ").mkString("")

    def addHeader() = {
      buffer += "|" + headers.zipWithIndex.map({case(name, ix) => padTo(name, widths(ix))} ).mkString("|")
    }

    def notNull(a: Any): String = {
      if(a == null) "null" else a.toString
    }

    def mkRow(row: Array[Any]): String = {
      "|" + row.zipWithIndex.map({case(v,ix) => padTo(notNull(v), widths(ix))}).mkString("|")
    }

    addHeader()

    data.foreach( row => buffer += mkRow(row))

    buffer.mkString("\n")
  }

}
