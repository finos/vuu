package org.finos.vuu.core.module.basket.csv

import scala.io.Source
import scala.reflect.io.File

object CsvStaticLoader {

  def loadStatic: Array[Array[String]] = {

    val path = getClass.getResource("/static/ftse.csv").getFile

    val file = File(path)

    println(file.toAbsolute.toString())

    val bufferedSource = Source.fromFile(path)
    val csv = for (line <- bufferedSource.getLines) yield line.split(",").map(_.trim)
    val array = csv.toArray
    bufferedSource.close
    array
  }

}
