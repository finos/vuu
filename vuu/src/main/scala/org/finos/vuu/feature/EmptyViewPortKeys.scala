package org.finos.vuu.feature
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.table.TablePrimaryKeys
import org.finos.vuu.feature.inmem.InMemViewPortKeys

object EmptyViewPortKeys extends ViewPortKeys {
  override def create(immutableArray: TablePrimaryKeys): ViewPortKeys = InMemViewPortKeys(immutableArray)
  override def sliceToArray(from: Int, to: Int): Array[String] = Array()
  override def get(index: Int): String = null
  override def sliceToKeys(from: Int, to: Int): ViewPortKeys = EmptyViewPortKeys
  override def toArray(): Array[String] = Array()
  override def length: Int = 0
  override def iterator: Iterator[String] = Array[String]().iterator
}
