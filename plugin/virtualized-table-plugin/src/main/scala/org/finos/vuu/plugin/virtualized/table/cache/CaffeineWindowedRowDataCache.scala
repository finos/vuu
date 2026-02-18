package org.finos.vuu.plugin.virtualized.table.cache

import com.github.benmanes.caffeine.cache.{Cache, Caffeine, RemovalCause}
import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.logging.LogAtFrequency
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.RowData
import org.finos.vuu.plugin.virtualized.table.WindowedCache

import java.util.concurrent.atomic.AtomicInteger

class CaffeineWindowedRowDataCache(val cacheSize: Int)(implicit clock: Clock) extends WindowedCache[String, RowData] with StrictLogging {

  val logAtFrequency = new LogAtFrequency(10_000)
  val removalCounter = new AtomicInteger()

  val cache: Cache[String, RowData] = Caffeine.newBuilder()
    .maximumSize(cacheSize)
    .removalListener((_: String, _: RowData, _: RemovalCause) => {
      val count = removalCounter.incrementAndGet()
      if (logAtFrequency.shouldLog()) {
        logger.debug(s"[ROWCACHE] Removing ${count} rowCache keys in last 10 seconds")
        removalCounter.set(0)
      }
    })
    .build()

  override def put(key: String, v: RowData): Option[RowData] = {
    if (key != null) {
      val currentValue = Option(cache.getIfPresent(key))
      cache.put(key, v)
      currentValue
    } else {
      None
    }    
  }

  override def get(key: String): Option[RowData] = {
    if(key != null){
      Option(cache.getIfPresent(key))
    }else{
      None
    }
  }
  override def removeAll(): Unit = cache.invalidateAll()

  override def remove(key: String): Option[RowData] = {
    if (key != null) {
      val currentValue = Option(cache.getIfPresent(key))
      cache.invalidate(key)
      currentValue
    } else {
      None
    }    
  }
}
