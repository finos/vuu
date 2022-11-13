package org.finos.vuu.state

import org.joda.time.format.DateTimeFormat

import java.util.concurrent.ConcurrentHashMap
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

