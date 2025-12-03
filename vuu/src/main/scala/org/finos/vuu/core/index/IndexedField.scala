package org.finos.vuu.core.index

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.toolbox.collection.set.ImmutableUniqueArraySet
import org.finos.vuu.core.table.Column
import org.finos.vuu.core.table.datatype.EpochTimestamp

import java.util.concurrent.{ConcurrentHashMap, ConcurrentSkipListMap}
import scala.jdk.CollectionConverters.IteratorHasAsScala

trait IndexedField[TYPE] {
  def insert(indexedValue: TYPE, rowKeys: String): Unit

  def remove(indexedValue: TYPE, rowKeys: String): Unit

  def column: Column

  def lessThan(bound: TYPE): ImmutableArray[String]

  def greaterThan(bound: TYPE): ImmutableArray[String]

  def find(indexedValue: TYPE): ImmutableArray[String]

  def find(indexedValues: List[TYPE]): ImmutableArray[String] = {
    indexedValues.foldLeft(ImmutableUniqueArraySet.empty[String]())((array, indexedKey) => array.++(find(indexedKey)))
  }
}

trait DoubleIndexedField extends IndexedField[Double]

trait BooleanIndexedField extends IndexedField[Boolean]

trait LongIndexedField extends IndexedField[Long]

trait IntIndexedField extends IndexedField[Int]

trait StringIndexedField extends IndexedField[String]

trait EpochTimestampIndexedField extends IndexedField[EpochTimestamp]

trait CharIndexedField extends IndexedField[Char]

class HashMapIndexedStringField(val column: Column) extends StringIndexedField with StrictLogging {
  private final val indexMap = new ConcurrentHashMap[String, ImmutableArray[String]]()

  override def remove(indexKey: String, rowKey: String): Unit = {
    logger.debug("Remove Index: " + this.column.name)
    indexMap.computeIfPresent(indexKey, (_, value) => {
      if (value.length > 1) {
        value.-(rowKey)
      } else {
        null
      }
    })
  }

  override def insert(indexKey: String, rowKey: String): Unit = {
    logger.debug("Update Index: " + this.column.name)
    indexMap.compute(indexKey, (_, value) =>  {
      value match {
        case null => ImmutableUniqueArraySet.from(Array(rowKey))
        case array: ImmutableArray[String] => array.+(rowKey).distinct
      }
    })
  }

  override def find(indexKey: String): ImmutableArray[String] = {
    logger.debug("Hit Index: " + this.column.name)
    indexMap.getOrDefault(indexKey, ImmutableUniqueArraySet.empty())
  }

  override def find(indexedValues: List[String]): ImmutableArray[String] = super.find(indexedValues)

  override def lessThan(bound: String): ImmutableArray[String] = {
    logger.warn("Less than is not supported for Strings")
    ImmutableUniqueArraySet.empty()
  }

  override def greaterThan(bound: String): ImmutableArray[String] = {
    logger.warn("Greater than is not supported for Strings")
    ImmutableUniqueArraySet.empty()
  }

}

class SkipListIndexedField[TYPE](val column: Column) extends IndexedField[TYPE] with StrictLogging {
  private final val skipList = new ConcurrentSkipListMap[TYPE, ImmutableArray[String]]()

  override def remove(indexKey: TYPE, rowKey: String): Unit = {
    logger.debug("Remove Index: " + this.column.name)
    skipList.computeIfPresent(indexKey, (_, value) => {
      if (value.length > 1) {
        value.-(rowKey)
      } else {
        null
      }
    })
  }

  override def insert(indexKey: TYPE, rowKey: String): Unit = {
    logger.debug("Update Index: " + this.column.name)
    skipList.compute(indexKey, (_, value) =>  {
      value match {
        case null => ImmutableUniqueArraySet.from(Array(rowKey))
        case array: ImmutableArray[String] => array.+(rowKey).distinct
      }
    })
  }

  override def find(indexKey: TYPE): ImmutableArray[String] = {
    logger.debug("Hit Index: " + this.column.name)
    skipList.getOrDefault(indexKey, ImmutableUniqueArraySet.empty())
  }

  def lessThan(bound: TYPE): ImmutableArray[String] = {
    logger.debug("Hit Index (LT): " + this.column.name)
    val result = (skipList.headMap(bound, false))
    IteratorHasAsScala(result.values().iterator()).asScala.foldLeft(ImmutableUniqueArraySet.empty[String](chunkSize = 5000))((arr, prev) => prev.addAll(arr)).distinct
  }

  def lessThanOrEqual(bound: TYPE): ImmutableArray[String] = {
    logger.debug("Hit Index (LTE): " + this.column.name)
    val result = (skipList.headMap(bound, true))
    IteratorHasAsScala(result.values().iterator()).asScala.foldLeft(ImmutableUniqueArraySet.empty[String](chunkSize = 5000))((arr, prev) => prev.++(arr)).distinct
  }

  def greaterThan(bound: TYPE): ImmutableArray[String] = {
    logger.debug("Hit Index (GT): " + this.column.name)
    val result = (skipList.tailMap(bound, false))
    IteratorHasAsScala(result.values().iterator()).asScala.foldLeft(ImmutableUniqueArraySet.empty[String](chunkSize = 5000))((arr, prev) => prev.++(arr)).distinct
  }

  def greaterThanOrEqual(bound: TYPE): ImmutableArray[String] = {
    logger.debug("Hit Index (GTE): " + this.column.name)
    val result = (skipList.tailMap(bound, true))
    IteratorHasAsScala(result.values().iterator()).asScala.foldLeft(ImmutableUniqueArraySet.empty[String](chunkSize = 5000))((arr, prev) => prev.++(arr)).distinct
  }

  override def find(indexedValues: List[TYPE]): ImmutableArray[String] = super.find(indexedValues)

}

class SkipListIndexedDoubleField(column: Column) extends SkipListIndexedField[Double](column) with DoubleIndexedField {}

class SkipListIndexedIntField(column: Column) extends SkipListIndexedField[Int](column) with IntIndexedField {}

class SkipListIndexedLongField(column: Column) extends SkipListIndexedField[Long](column) with LongIndexedField {}

class SkipListIndexedBooleanField(column: Column) extends SkipListIndexedField[Boolean](column) with BooleanIndexedField {}

class SkipListIndexedEpochTimestampField(column: Column) extends SkipListIndexedField[EpochTimestamp](column) with EpochTimestampIndexedField {}

class SkipListIndexedCharField(column: Column) extends SkipListIndexedField[Char](column) with CharIndexedField {}