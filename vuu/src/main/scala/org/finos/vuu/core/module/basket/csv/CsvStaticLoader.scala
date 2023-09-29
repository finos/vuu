package org.finos.vuu.core.module.basket.csv

import scala.io.Source

object CsvStaticLoader {

  def load: Array[String] = {
    val staticDirPath = getClass.getResource("/static").getPath
    val dir = new java.io.File(staticDirPath)
    val csvFiles = dir.listFiles.filter(_.isFile)
      .filter(_.getName.endsWith(".csv"))
    val ids = csvFiles.map(e => "." + e.getName.replace(".csv", "").toUpperCase)
    ids
  }

  def loadStatic: Map[String, Array[Map[String, String]]] = {
    var map: Map[String, Array[Map[String, String]]] = Map()
    val staticDirPath = getClass.getResource("/static").getPath
    val dir = new java.io.File(staticDirPath)
    val csvFiles = dir.listFiles.filter(_.isFile)
      .filter(_.getName.endsWith(".csv"))

    csvFiles.foreach(csvFile => {
      println(csvFile)

      val bufferedSource = Source.fromFile(csvFile)
      val csv = for (line <- bufferedSource.getLines) yield line.split(",").map(_.trim)
      val array = csv.toArray
      bufferedSource.close
      var data: Map[String, String] = Map()
      val header = array(0)
      val symbolInd = header.indexOf("Symbol")
      val nameInd = header.indexOf("Name")
      val lastTradeInd = header.indexOf("Last Trade")
      val volumeInd = header.indexOf("Volume")
      val weightInd = header.indexOf("Weight")
      val changeInd = header.indexOf("Change")
      val list = array.tail.map(e => Map(
        "Symbol" -> getValueFromIndex(symbolInd, e),
        "Last Trade" -> getValueFromIndex(lastTradeInd, e),
        "Name" -> getValueFromIndex(nameInd, e),
        "Weight" -> getValueFromIndex(weightInd, e),
        "Volume" -> getValueFromIndex(volumeInd, e),
        "Change" -> getValueFromIndex(changeInd, e)
      ))
      val fileName = csvFile.getName.replace(".csv", "")
      map += ("." + fileName.toUpperCase -> list)
    })
    map
  }

  private def getValueFromIndex(index: Int, e: Array[String]) = {
    if (e.length > index && index > -1) e(index) else null
  }
}
