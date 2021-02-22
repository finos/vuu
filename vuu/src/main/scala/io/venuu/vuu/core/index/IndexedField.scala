package io.venuu.vuu.core.index

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.ImmutableArray
import io.venuu.vuu.core.table.Column

import java.util.concurrent.ConcurrentSkipListMap

trait IndexedField[TYPE]{
  def insertIndexedValue(indexedValue: TYPE, rowKeys: String)
  def removedIndexedValue(indexedValue: TYPE, rowKeys: String)
  def isForColumn(column: Column): Boolean
  def column:Column
  def rowKeysForValue(indexedValue: TYPE): ImmutableArray[String]
  def rowKeysForValues(indexedValues: List[TYPE]): ImmutableArray[String] = {
    indexedValues.foldLeft(ImmutableArray.empty[String])((array, indexedKey) => array.++(rowKeysForValue(indexedKey)))
  }
}

trait LongIndexedField{
  def isForColumn(column: Column): Boolean
  def column:Column
  def rowKeysForValue(v: Long): ImmutableArray[String]
  def rowKeysBetweenValues(lowerBound: Long, upperBound: Long): ImmutableArray[String]
  def rowKeysLessThan(bound: Long): ImmutableArray[String]
  def rowKeysGreaterThan(bound: Long): ImmutableArray[String]
}

class SkipListIndexedStringField(val column: Column) extends IndexedField[String] with StrictLogging {
  private final val skipList = new ConcurrentSkipListMap[Int, ImmutableArray[String]]()

  override def removedIndexedValue(indexKey: String, rowKey: String): Unit = {
    val indexKeyHash = indexKey.hashCode
    skipList.get(indexKeyHash) match {
      case null =>
      case arr: ImmutableArray[String] =>
        skipList.put(indexKeyHash, arr.-(rowKey))
    }
  }

  override def insertIndexedValue(indexKey: String, rowKey: String): Unit = {
    val indexKeyHash = indexKey.hashCode
    skipList.get(indexKeyHash) match {
      case null =>
        skipList.put(indexKeyHash, ImmutableArray.from(Array(rowKey)))
      case arr: ImmutableArray[String] =>
        skipList.put(indexKeyHash, arr.+(rowKey))
    }
  }

  override def isForColumn(column: Column): Boolean = ???

  override def rowKeysForValue(indexKey: String): ImmutableArray[String] = {
    val indexKeyHash = indexKey.hashCode
    skipList.get(indexKeyHash)
  }

  override def rowKeysForValues(indexedValues: List[String]): ImmutableArray[String] = super.rowKeysForValues(indexedValues)
}


class SkipListIndexedIntField(val column: Column) extends IndexedField[Int]  {

  private final val skipList = new ConcurrentSkipListMap[Int, ImmutableArray[String]]()

  override def removedIndexedValue(indexKey: Int, rowKey: String): Unit = {
    skipList.get(indexKey) match {
      case null =>
      case arr: ImmutableArray[String] =>
        skipList.put(indexKey, arr.-(rowKey))
    }
  }

  override def insertIndexedValue(indexKey: Int, rowKey: String): Unit = {
    skipList.get(indexKey) match {
      case null =>
        skipList.put(indexKey, ImmutableArray.from(Array(rowKey)))
      case arr: ImmutableArray[String] =>
        skipList.put(indexKey, arr.+(rowKey).distinct)
    }
  }
  override def isForColumn(column: Column): Boolean = ???

  override def rowKeysForValue(indexKey: Int): ImmutableArray[String] = {
    skipList.get(indexKey) match {
      case null =>
        ImmutableArray.empty[String]
      case arr: ImmutableArray[String] =>
        arr
    }
  }

  override def rowKeysForValues(indexedValues: List[Int]): ImmutableArray[String] = super.rowKeysForValues(indexedValues)
}
