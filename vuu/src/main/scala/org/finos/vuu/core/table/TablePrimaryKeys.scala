package org.finos.vuu.core.table

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys

object EmptyTablePrimaryKeys extends TablePrimaryKeys{
  override def length: Int = 0
  override def add(key: String): TablePrimaryKeys = this.+(key)
  override def +(key: String): TablePrimaryKeys = InMemTablePrimaryKeys(ImmutableArray.from(Array(key)))
  override def remove(key: String): TablePrimaryKeys = EmptyTablePrimaryKeys
  override def -(key: String): TablePrimaryKeys = EmptyTablePrimaryKeys
  override def sliceTableKeys(from: Int, until: Int): TablePrimaryKeys = EmptyTablePrimaryKeys
  override def iterator: Iterator[String] = Array().iterator

  override def get(index: Int): String = null
}

trait TablePrimaryKeys extends Iterable[String] {
  def length: Int
  def add(key: String): TablePrimaryKeys
  def +(key: String): TablePrimaryKeys
  def remove(key: String): TablePrimaryKeys
  def -(key: String): TablePrimaryKeys
  def sliceTableKeys(from: Int, until: Int): TablePrimaryKeys
  def get(index: Int): String

}



