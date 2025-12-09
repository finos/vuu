package org.finos.vuu.feature.inmem

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.table.{EmptyTablePrimaryKeys, TablePrimaryKeys}

case class InMemTablePrimaryKeys(keys: ImmutableArray[String]) extends TablePrimaryKeys{
  override def iterator: Iterator[String] = keys.iterator
  override def sliceTableKeys(from: Int, until: Int): TablePrimaryKeys = {
    InMemTablePrimaryKeys(ImmutableArray.from(keys.slice(from, until).toArray))
  }
  override def length: Int = keys.length

  override def add(key: String): TablePrimaryKeys = InMemTablePrimaryKeys(keys + key)

  override def +(key: String): TablePrimaryKeys = InMemTablePrimaryKeys(keys + key)

  override def remove(key: String): TablePrimaryKeys = InMemTablePrimaryKeys(keys - key)
  override def -(key: String): TablePrimaryKeys = InMemTablePrimaryKeys(keys - key)
  override def get(index: Int): String = keys.getIndex(index)
  override def set(index: Int, key: String): TablePrimaryKeys = InMemTablePrimaryKeys(keys.set(index, key))

  override def intersect(otherKeys: Iterable[String]): TablePrimaryKeys = {
    if (otherKeys.isEmpty) {
      EmptyTablePrimaryKeys
    } else {
      val intersection = keys.filter(otherKeys.toSet.contains).toArray
      InMemTablePrimaryKeys(ImmutableArray.from(intersection))
    }    
  }
}
