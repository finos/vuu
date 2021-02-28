package io.venuu.vuu.core.index

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.ImmutableArray
import io.venuu.vuu.core.table.Column

import java.util.concurrent.ConcurrentSkipListMap
import scala.jdk.CollectionConverters._

trait IndexedField[TYPE]{
  def insert(indexedValue: TYPE, rowKeys: String)
  def remove(indexedValue: TYPE, rowKeys: String)
  def column:Column
  def lessThan(bound: TYPE): ImmutableArray[String]
  def greaterThan(bound: TYPE): ImmutableArray[String]
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

  override def find(indexKey: String): ImmutableArray[String] = {
    val indexKeyHash = indexKey.hashCode
    skipList.get(indexKeyHash)
  }

  override def find(indexedValues: List[String]): ImmutableArray[String] = super.find(indexedValues)

  override def lessThan(bound: String): ImmutableArray[String] = ???
  override def greaterThan(bound: String): ImmutableArray[String] = ???
}

class SkipListIndexedField[TYPE](val column: Column) extends IndexedField[TYPE] with StrictLogging {
  private final val skipList = new ConcurrentSkipListMap[TYPE, ImmutableArray[String]]()

  override def remove(indexKey: TYPE, rowKey: String): Unit = {
    logger.debug("Remove Index: " + this.column.name)
    skipList.get(indexKey) match {
      case null =>
      case arr: ImmutableArray[String] =>
        skipList.put(indexKey, arr.-(rowKey))
    }
  }

  override def insert(indexKey: TYPE, rowKey: String): Unit = {
    logger.debug("Update Index: " + this.column.name)
    skipList.get(indexKey) match {
      case null =>
        skipList.put(indexKey, ImmutableArray.from(Array(rowKey)))
      case arr: ImmutableArray[String] =>
        skipList.put(indexKey, arr.+(rowKey).distinct)
    }
  }

  override def find(indexKey: TYPE): ImmutableArray[String] = {
    logger.debug("Hit Index: " + this.column.name)
    skipList.get(indexKey) match {
      case null =>
        ImmutableArray.empty[String]
      case arr: ImmutableArray[String] =>
        arr
    }
  }

  def lessThan(bound: TYPE): ImmutableArray[String] = {
    logger.debug("Hit Index (LT): " + this.column.name)
    val result = (skipList.headMap(bound, false))
    IteratorHasAsScala(result.values().iterator()).asScala.foldLeft(ImmutableArray.empty[String])((arr, prev) => prev.++(arr)).distinct
  }

  def lessThanOrEqual(bound: TYPE): ImmutableArray[String] = {

    val result = (skipList.headMap(bound, true))
    IteratorHasAsScala(result.values().iterator()).asScala.foldLeft(ImmutableArray.empty[String])((arr, prev) => prev.++(arr)).distinct
  }

  def greaterThan(bound: TYPE): ImmutableArray[String] = {
    logger.debug("Hit Index (GT): " + this.column.name)
    val result = (skipList.tailMap(bound, false))
    IteratorHasAsScala(result.values().iterator()).asScala.foldLeft(ImmutableArray.empty[String])((arr, prev) => prev.++(arr)).distinct
  }

  def greaterThanOrEqual(bound: TYPE): ImmutableArray[String] = {
    val result = (skipList.tailMap(bound, true))
    IteratorHasAsScala(result.values().iterator()).asScala.foldLeft(ImmutableArray.empty[String])((arr, prev) => prev.++(arr)).distinct
  }

  override def find(indexedValues: List[TYPE]): ImmutableArray[String] = super.find(indexedValues)
}


class SkipListIndexedDoubleField(column: Column) extends SkipListIndexedField[Double](column){}
class SkipListIndexedIntField(column: Column) extends SkipListIndexedField[Int](column){}
class SkipListIndexedLongField(column: Column) extends SkipListIndexedField[Long](column){}
class SkipListIndexedBooleanField(column: Column) extends SkipListIndexedField[Boolean](column){}
