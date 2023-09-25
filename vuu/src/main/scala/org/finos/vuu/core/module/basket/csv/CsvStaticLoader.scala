package org.finos.vuu.core.module.basket.csv

import scala.io.Source

object CsvStaticLoader {

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
        "Symbol" -> e(symbolInd),
        "Last Trade" -> e(lastTradeInd),
        "Name" -> e(nameInd),
        //      "Weight" -> e(weightInd),
        //      "Volume" -> e(volumeInd),
//        "Change" -> (if (e.length > changeInd) e(changeInd) else null)
      ))
      val fileName = csvFile.getName.replace(".csv", "")
      map += ("."+fileName.toUpperCase -> list)
    })
    map
  }

}
