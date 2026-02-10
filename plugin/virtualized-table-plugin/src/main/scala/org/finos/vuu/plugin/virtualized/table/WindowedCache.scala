package org.finos.vuu.plugin.virtualized.table

import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.RowData
import org.finos.vuu.plugin.virtualized.table.cache.CaffeineWindowedRowDataCache

trait WindowedCache[KEY, VALUE] {
  def put(key: KEY, v: VALUE): Option[VALUE]
  def get(key: KEY): Option[VALUE]
  def remove(key: KEY): Option[VALUE]
  def removeAll(): Unit
}

object RowDataCache{
  def apply(cacheSize: Int)(implicit clock: Clock): WindowedCache[String, RowData] = {
    new CaffeineWindowedRowDataCache(cacheSize)
  }

}
