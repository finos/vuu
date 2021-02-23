package io.venuu.vuu.core.index

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.ImmutableArray
import io.venuu.vuu.core.table.Column

import java.util.concurrent.ConcurrentSkipListMap
import scala.collection.JavaConverters

trait IndexedField[TYPE]{
  def insert(indexedValue: TYPE, rowKeys: String)
  def remove(indexedValue: TYPE, rowKeys: String)
  def isForColumn(column: Column): Boolean
  def column:Column
  def lessThan(bound: Int): ImmutableArray[String]
  def greaterThan(bound: Int): ImmutableArray[String]
  def find(indexedValue: TYPE): ImmutableArray[String]
  def find(indexedValues: List[TYPE]): ImmutableArray[String] = {
    indexedValues.foldLeft(ImmutableArray.empty[String])((array, indexedKey) => array.++(find(indexedKey)))
  }
}

class SkipListIndexedStringField(val column: Column) extends IndexedField[String] with StrictLogging {
  private final val skipList = new ConcurrentSkipListMap[Int, ImmutableArray[String]]()

  override def remove(indexKey: String, rowKey: String): Unit = {
    val indexKeyHash = indexKey.hashCode
    skipList.get(indexKeyHash) match {
      case null =>
      case arr: ImmutableArray[String] =>
        skipList.put(indexKeyHash, arr.-(rowKey))
    }
  }

  override def insert(indexKey: String, rowKey: String): Unit = {
    val indexKeyHash = indexKey.hashCode
    skipList.get(indexKeyHash) match {
      case null =>
        skipList.put(indexKeyHash, ImmutableArray.from(Array(rowKey)))
      case arr: ImmutableArray[String] =>
        skipList.put(indexKeyHash, arr.+(rowKey).distinct)
    }
  }

  override def isForColumn(column: Column): Boolean = ???

  override def find(indexKey: String): ImmutableArray[String] = {
    val indexKeyHash = indexKey.hashCode
    skipList.get(indexKeyHash)
  }

  override def find(indexedValues: List[String]): ImmutableArray[String] = super.find(indexedValues)

  override def lessThan(bound: Int): ImmutableArray[String] = ???
  override def greaterThan(bound: Int): ImmutableArray[String] = ???
}


class SkipListIndexedIntField(val column: Column) extends IndexedField[Int]  {

  private final val skipList = new ConcurrentSkipListMap[Int, ImmutableArray[String]]()

  override def remove(indexKey: Int, rowKey: String): Unit = {
    skipList.get(indexKey) match {
      case null =>
      case arr: ImmutableArray[String] =>
        skipList.put(indexKey, arr.-(rowKey))
    }
  }

  override def insert(indexKey: Int, rowKey: String): Unit = {
    skipList.get(indexKey) match {
      case null =>
        skipList.put(indexKey, ImmutableArray.from(Array(rowKey)))
      case arr: ImmutableArray[String] =>
        skipList.put(indexKey, arr.+(rowKey).distinct)
    }
  }
  override def isForColumn(column: Column): Boolean = ???

  override def find(indexKey: Int): ImmutableArray[String] = {
    skipList.get(indexKey) match {
      case null =>
        ImmutableArray.empty[String]
      case arr: ImmutableArray[String] =>
        arr
    }
  }

  def lessThan(bound: Int): ImmutableArray[String] = {
    val result = (skipList.headMap(bound, false))
    JavaConverters.asScalaIterator(result.values().iterator()).foldLeft(ImmutableArray.empty[String])((arr, prev) => prev.++(arr)).distinct
  }

  def lessThanOrEqual(bound: Int): ImmutableArray[String] = {
    val result = (skipList.headMap(bound, true))
    JavaConverters.asScalaIterator(result.values().iterator()).foldLeft(ImmutableArray.empty[String])((arr, prev) => prev.++(arr)).distinct
  }

  def greaterThan(bound: Int): ImmutableArray[String] = {
    val result = (skipList.tailMap(bound, false))
    JavaConverters.asScalaIterator(result.values().iterator()).foldLeft(ImmutableArray.empty[String])((arr, prev) => prev.++(arr)).distinct
  }

  def greaterThanOrEqual(bound: Int): ImmutableArray[String] = {
    val result = (skipList.tailMap(bound, true))
    JavaConverters.asScalaIterator(result.values().iterator()).foldLeft(ImmutableArray.empty[String])((arr, prev) => prev.++(arr)).distinct
  }

  override def find(indexedValues: List[Int]): ImmutableArray[String] = super.find(indexedValues)
}
