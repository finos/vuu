package org.finos.vuu.feature.inmem

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.feature.ViewPortKeys

case class InMemViewPortKeys(keys: ImmutableArray[String]) extends ViewPortKeys{
  override def create(immutableArray: ImmutableArray[String]): ViewPortKeys = InMemViewPortKeys(immutableArray)
  override def get(index: Int): String = keys(index)
  override def slice(from: Int, to: Int): Array[String] = keys.slice(from, to).toArray
  override def sliceToKeys(from: Int, to: Int): ViewPortKeys = InMemViewPortKeys(ImmutableArray.from(keys.slice(from, to).toArray))
  override def length: Int = keys.length
  override def toArray(): Array[String] = keys.toArray
}
