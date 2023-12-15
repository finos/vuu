package org.finos.vuu.core.module.basket.csv

import com.typesafe.scalalogging.StrictLogging

import java.io.File
import scala.io.Source
import scala.util.control.NonFatal

object CsvStaticLoader extends StrictLogging {
  def loadConstituent(basketId: String, resourcePath: Option[String] = None): Array[Map[String, Any]] = {
    try {

      val constituentsFilesDirectory =
        if(resourcePath.isDefined) resourcePath.get
        else getClass.getResource("/static").getPath

      val dir = new File(constituentsFilesDirectory)
      val csvFiles = dir.listFiles.filter(_.isFile)
        .filter(_.getName.endsWith(basketId.replace(".", "").toLowerCase + ".csv"))

      if (csvFiles.isEmpty) {
        logger.error(s"Failed to find constituents file for $basketId")
        Array.empty
      }
      else {
        val csvFile = csvFiles(0)
        logger.info("Loading basket static:" + basketId + "(" + csvFile + ")")
        val rows = readFileContent(csvFile)
        logger.info(s"Found ${rows.length} constituents for basket $basketId")

        val header = rows(0)
        val symbolInd = header.indexOf("Symbol")
        val nameInd = header.indexOf("Name")
        val lastTradeInd = header.indexOf("Last Trade")
        val volumeInd = header.indexOf("Volume")
        val weightInd = header.indexOf("Weighting")
        val changeInd = header.indexOf("Change")

        val constituents = rows.tail.map(e => {
          val weighting = if (getValueFromIndex(weightInd, e) == null) 0.0D else getValueFromIndex(weightInd, e).toDouble
          Map[String, Any](
            "Symbol" -> getValueFromIndex(symbolInd, e),
            "Last Trade" -> getValueFromIndex(lastTradeInd, e),
            "Name" -> getValueFromIndex(nameInd, e),
            "Weighting" -> weighting,
            "Volume" -> getValueFromIndex(volumeInd, e),
            "Change" -> getValueFromIndex(changeInd, e)
          )
        })
        constituents

      }
    }
    catch {
      case NonFatal(t) => logger.error(s"Failed to parse constituents for $basketId", t)
        Array.empty
    }
  }


  private def readFileContent(csvFile: File): Array[Array[String]] = {
    val bufferedSource = Source.fromFile(csvFile)
    val csv = for (line <- bufferedSource.getLines) yield line.split(",").map(_.trim)
    val array = csv.toArray
    bufferedSource.close
    array
  }

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
