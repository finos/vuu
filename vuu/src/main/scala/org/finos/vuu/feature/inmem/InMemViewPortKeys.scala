package org.finos.vuu.feature.inmem

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.table.TablePrimaryKeys
import org.finos.vuu.feature.ViewPortKeys

case class InMemViewPortKeys(keys: TablePrimaryKeys) extends ViewPortKeys{
  override def create(immutableArray: TablePrimaryKeys): ViewPortKeys = InMemViewPortKeys(immutableArray)
  override def get(index: Int): String = {
    keys.get(index)
  }
  override def sliceToArray(from: Int, to: Int): Array[String] = keys.slice(from, to).toArray
  override def sliceToKeys(from: Int, to: Int): ViewPortKeys = InMemViewPortKeys(keys.sliceTableKeys(from, to))
  override def length: Int = keys.length
  override def toArray(): Array[String] = keys.toArray
  override def iterator: Iterator[String] = keys.iterator
}
