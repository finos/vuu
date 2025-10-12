package org.finos.vuu.core.module.basket.csv

import java.io.File
import scala.io.Source

object FileLoader {
  def getFileNames(folderPath: String, extensionFilter: String): Array[String] = {
    getFiles(folderPath)
      .filter(_.getName.endsWith(extensionFilter))
      .map(file => file.getName)
  }

  def getFiles(folderPath: String, fileName: String): Array[File] = {
    getFiles(folderPath)
      .filter(_.getName.equals(fileName))
  }

  def readCsvContent(file: File): CsvContent = {
    val bufferedSource = Source.fromFile(file)
    val csv = for (line <- bufferedSource.getLines()) yield line.split(",").map(_.trim())
    val array = csv.toArray
    bufferedSource.close
    new CsvContent(array)
  }

  private def getFiles(folderPath: String): Array[File] = {
    val dir = new File(folderPath)
    if (dir.listFiles == null) Array.empty
    else dir.listFiles.filter(_.isFile)
  }
}
