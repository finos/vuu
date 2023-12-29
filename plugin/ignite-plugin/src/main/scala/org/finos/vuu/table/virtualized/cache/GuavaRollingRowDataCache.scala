package org.finos.vuu.table.virtualized.cache

import com.google.common.cache.{Cache, CacheBuilder, RemovalListener, RemovalNotification}
import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.RowData
import org.finos.vuu.table.virtualized.RollingCache

class GuavaRollingRowDataCache(val cacheSize: Int) extends RollingCache[String, RowData] with StrictLogging {

  val cache: Cache[String, RowData] = CacheBuilder.newBuilder()
    .maximumSize(cacheSize)
    .removalListener((notification: RemovalNotification[String, RowData]) => logger.info(s"Removing rowCache key: ${notification.getKey} value:${notification.getValue}"))
    .build()

  override def put(key: String, v: RowData): Unit = {
    cache.put(key, v)
  }

  override def get(key: String): Option[RowData] = {
    Option(cache.getIfPresent(key))
  }
  override def removeAll(): Unit = cache.invalidateAll()

  override def remove(key: String): Unit = cache.invalidate(key)
}
