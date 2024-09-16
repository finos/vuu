package org.finos.vuu.core.module.basket.csv

import com.typesafe.scalalogging.StrictLogging

import scala.util.control.NonFatal

class BasketLoader(resourcePath: Option[String] = None) extends StrictLogging {
  def loadBasketIds(): Array[String] = {
    FileLoader.getFileNames(getPath(resourcePath), ".csv")
      .map(fileName => "." + fileName.replace(".csv", "").toUpperCase)
  }

  def loadConstituents(basketId: String): Array[Map[String, Any]] = {
    try {
      val filePath = getPath(resourcePath)
      val csvFiles = FileLoader.getFiles(filePath, getBasketFileName(basketId))

      if (csvFiles.isEmpty) {
        logger.error(s"Failed to find constituents file for $basketId in $filePath")
        Array.empty
      }
      else {
        val csvFile = csvFiles(0)
        logger.debug("Loading basket static:" + basketId + "(" + csvFile + ")")
        val csvContent = FileLoader.readCsvContent(csvFile)

        logger.debug(s"Found ${csvContent.dataRows.length} constituents for basket $basketId")

        csvContent.dataRows.map(row => toConstituentMap(csvContent, row))
      }
    }
    catch {
      case NonFatal(t) => logger.error(s"Failed to get and parse constituents for $basketId", t)
        Array.empty
    }
  }

  private def toConstituentMap(csvContent: CsvContent, row: Array[String]) = {
    Map[String, Any](
      "Symbol" -> csvContent.getValue("Symbol", row),
      "Last Trade" -> csvContent.getValue("Last Trade", row),
      "Name" -> csvContent.getValue("Name", row),
      "Weighting" -> csvContent.getValueAsDouble("Weighting", row, 0.0D),
      "Volume" -> csvContent.getValue("Volume", row),
      "Change" -> csvContent.getValue("Change", row)
    )
  }

  private def getBasketFileName(basketId: String) = {
    basketId.replace(".", "").toLowerCase + ".csv"
  }

  private def getPath(resourcePath: Option[String] = None): String = {
    if (resourcePath.isDefined) resourcePath.get
    else {
      val url = getStaticResourcePath
      if (url == null) "" else url.getPath
    }
  }

  private def getStaticResourcePath =
    getClass.getResource("/static")
}
