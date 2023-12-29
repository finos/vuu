package org.finos.vuu.plugin.virtualized.table

import org.finos.vuu.core.table.RowData
import org.finos.vuu.plugin.virtualized.table.cache.GuavaRollingRowDataCache

trait RollingCache[KEY, VALUE] {
  def put(key: KEY, v: VALUE): Unit
  def get(key: KEY): Option[VALUE]
  def remove(key: KEY): Unit
  def removeAll(): Unit
}

object RowDataCache{
  def apply(cacheSize: Int): RollingCache[String, RowData] = {
    new GuavaRollingRowDataCache(cacheSize)
  }

}
