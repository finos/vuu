package org.finos.vuu.plugin.virtualized.table.cache

import com.github.benmanes.caffeine.cache.{Cache, Caffeine, RemovalCause}
import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.logging.LogAtFrequency
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.RowData

import java.util.concurrent.atomic.AtomicInteger

class CaffeineWindowedRowDataCache(val cacheSize: Int)(using clock: Clock) extends WindowedCache[String, RowData] with StrictLogging {

  private val logAtFrequency = new LogAtFrequency(10_000)
  private val removalCounter = new AtomicInteger()
  val cache: Cache[String, RowData] = Caffeine.newBuilder()
    .maximumSize(cacheSize)
    .removalListener((_: String, _: RowData, cause: RemovalCause) => {
      if (cause.wasEvicted()) {
        removalCounter.incrementAndGet()
        if (logAtFrequency.shouldLog()) {
          val snapshotCount = removalCounter.getAndSet(0)
          if (snapshotCount > 0) {
            logger.debug(s"[ROWCACHE] Removed $snapshotCount rowCache keys due to size limits")
          }
        }
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
