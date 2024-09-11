package org.finos.vuu.plugin.virtualized.table.cache

import com.google.common.cache.{Cache, CacheBuilder, RemovalListener, RemovalNotification}
import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.logging.LogAtFrequency
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.RowData
import org.finos.vuu.plugin.virtualized.table.WindowedCache

import java.util.concurrent.atomic.AtomicInteger

class GuavaWindowedRowDataCache(val cacheSize: Int)(implicit clock: Clock) extends WindowedCache[String, RowData] with StrictLogging {

  val logAtFrequency = new LogAtFrequency(10_000)
  val removalCounter = new AtomicInteger()

  val cache: Cache[String, RowData] = CacheBuilder.newBuilder()
    .maximumSize(cacheSize)
    .removalListener((notification: RemovalNotification[String, RowData]) => {

      val count = removalCounter.incrementAndGet()

      if(logAtFrequency.shouldLog()){
        logger.debug(s"[ROWCACHE] Removing ${count} rowCache keys in last 10 seconds")
        removalCounter.set(0)
      }

    })
    .build()

  override def put(key: String, v: RowData): Unit = {
    cache.put(key, v)
  }

  override def get(key: String): Option[RowData] = {
    if(key != null){
      Option(cache.getIfPresent(key))
    }else{
      None
    }
  }
  override def removeAll(): Unit = cache.invalidateAll()

  override def remove(key: String): Unit = cache.invalidate(key)
}
