package io.venuu.vuu.state

import com.typesafe.scalalogging.StrictLogging
import org.joda.time.format.DateTimeFormat

import java.io.{File, FilenameFilter, PrintWriter}
import java.nio.file.{Files, Path, Paths}
import java.util.concurrent.ConcurrentHashMap
import scala.io.Source
import scala.jdk.CollectionConverters._


case class VuiHeader(user: String, id: String, uniqueId: String, lastUpdate: Long)

case class VuiJsonState(json: String)

case class VuiState(header: VuiHeader, json: VuiJsonState)

trait VuiStateStore {
  def add(state: VuiState): Unit

  def get(user: String, id: String): Option[VuiState]

  def delete(user: String, id: String): Unit

  def getAllFor(user: String): List[VuiHeader]

  def getAll(): List[VuiHeader]

  private val dateTimeFormat = DateTimeFormat.forPattern("YYYY-MM-dd_HHmmss.SSS")

  def timeToVersion(time: Long): String = {
    dateTimeFormat.print(time)
  }
}

class FileBackedVuiStateStore(val storageDir: String, val maxItemsPerUser: Int = 50) extends VuiStateStore with StrictLogging {

  def createPath(directory: String): Unit = {
    Files.createDirectories(Paths.get(directory))
  }

  def writeFile(filePath: String, contents: String): Unit ={
    //Files.createDirectories(Paths.get(filePath))
    val writer = new PrintWriter(new File(filePath))
    writer.print(contents);
    writer.close()
  }

  def listFiles(directory: String): Array[File] ={
    Paths.get(directory).toFile.listFiles()
  }

  def readFile(filePath: String): String = {
    val source = Source.fromFile(filePath)
    val lines = source.getLines().mkString
    source.close()
    lines
  }

  def userPath(user: String): String = {
      storageDir + File.separator + user + "/"
  }

  def fileToHeader(file: File): VuiHeader = {

  }

  override def add(state: VuiState): Unit = {
    val path = userPath(state.header.user)
    createPath(path)
    val version = state.header.lastUpdate.toString
    val fileName = path + version + "-" + state.header.id + "-" + state.header.uniqueId + ".json"
    writeFile(fileName, state.json.json)
  }

  override def get(user: String, id: String): Option[VuiState] = {
    val thePath = userPath(user)
    val files = Paths.get(thePath).toFile.listFiles( new FilenameFilter {
      override def accept(dir: File, name: String): Boolean = name.endsWith(user + "." + id + ".json")
    })
    val pieces = files.head.getName.split("-")

    val path = files.head.getPath

    //val theUser = pieces(0).toString()
    val lastUpdate = pieces(0).toString().toLong
    val theId = pieces(1).toString()
    val uniqueId = pieces(2).toString().replace(".json", "")

    val contents = readFile(path)

    Some(VuiState(VuiHeader(user, theId, uniqueId, lastUpdate), VuiJsonState(contents)))
  }

  override def delete(user: String, id: String): Unit = {
    val thePath = userPath(user)
    val files = Paths.get(thePath).toFile.listFiles( new FilenameFilter {
      override def accept(dir: File, name: String): Boolean = name.endsWith(user + "." + id + ".json")
    })
    files.headOption match {
      case Some(file) => file.delete()
      case None =>
        logger.error(s"Tried to delete version that doesn't exist: $user $id")
    }
  }

  override def getAllFor(user: String): List[VuiHeader] = {
    val thePath = userPath(user)
    val files = listFiles(thePath)


  }

  override def getAll(): List[VuiHeader] = ???
}

class MemoryBackedVuiStateStore(val maxItemsPerUser: Int = 50) extends VuiStateStore {

  private val storeByUser = new ConcurrentHashMap[String, Map[String, VuiState]]()

  override def delete(user: String, id: String): Unit = {
    storeByUser.put(user, storeByUser.getOrDefault(user, Map()).-(id))
  }

  def toUniqueId(user: String, version: String): String = {
    s"${user}.${version}"
  }

  override def add(state: VuiState): Unit = {
    val stateByUser = storeByUser.getOrDefault(state.header.user, Map())

    val updatedStateByUser = if (state.header.id == "latest") {
      val version = timeToVersion(state.header.lastUpdate)
      stateByUser ++ Map(state.header.id -> state) ++ Map(version -> state.copy(header = state.header.copy(id = version, uniqueId = toUniqueId(state.header.user, version))))
    } else {
      stateByUser ++ Map(state.header.id -> state) ++ Map("latest" -> state.copy(header = state.header.copy(id = "latest", uniqueId = toUniqueId(state.header.user, "latest"))))
    }

    val restrictedBySize = restrictToMaxSize(maxItemsPerUser, updatedStateByUser)

    storeByUser.put(state.header.user, restrictedBySize)
  }

  private def restrictToMaxSize(maxSize: Int, statesByUser: Map[String, VuiState]): Map[String, VuiState] = {
    if (statesByUser.size > maxSize) {
      val oldest = statesByUser.values.filter(_.header.id != "latest").toList.sortBy(_.header.lastUpdate).head
      statesByUser.-(oldest.header.id)
    } else {
      statesByUser
    }
  }

  override def get(user: String, id: String): Option[VuiState] = {
    storeByUser.getOrDefault(user, Map()).get(id)
  }

  override def getAllFor(user: String): List[VuiHeader] = storeByUser.getOrDefault(user, Map()).map(_._2.header).toList

  override def getAll(): List[VuiHeader] = {
    storeByUser.asScala.map(_._2).flatMap(_.values.map(_.header).toList).toList
  }
}

