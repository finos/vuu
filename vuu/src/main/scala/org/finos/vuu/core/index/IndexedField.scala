package org.finos.vuu.core.index

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.collection.array.{ImmutableArray, VectorImmutableArray}
import org.finos.toolbox.collection.set.ImmutableArraySet
import org.finos.vuu.core.table.Column
import org.finos.vuu.core.table.datatype.EpochTimestamp

import java.util.concurrent.{ConcurrentHashMap, ConcurrentNavigableMap, ConcurrentSkipListMap}
import scala.collection.mutable

trait IndexedField[TYPE] {

  protected val empty: ImmutableArray[String] = ImmutableArray.empty

  def insert(indexedValue: TYPE, rowKey: String): Unit

  def replace(oldIndexedValue: TYPE, newIndexedValue: TYPE, rowKey: String): Unit
  
  def remove(indexedValue: TYPE, rowKey: String): Unit

  def column: Column

  def lessThan(bound: TYPE): ImmutableArray[String]

  def greaterThan(bound: TYPE): ImmutableArray[String]

  def find(indexedValue: TYPE): ImmutableArray[String]

  def find(indexedValues: List[TYPE]): ImmutableArray[String] = {
    if (indexedValues.isEmpty) {
      empty
    } else if (indexedValues.length == 1) {
      find(indexedValues.head)
    } else {
      ImmutableArray.from(indexedValues.iterator.flatMap(f => find(f)))
    }
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

  private final val indexMap = new ConcurrentHashMap[String, ImmutableArraySet[String]]()

  override def remove(indexKey: String, rowKey: String): Unit = {
    logger.trace(s"Removing value $rowKey from ${column.name} index")
    indexMap.computeIfPresent(indexKey, (_, value) => {
      if (value.length > 1) {
        value.-(rowKey)
      } else {
        null
      }
    })
  }

  override def insert(indexKey: String, rowKey: String): Unit = {
    logger.trace(s"Inserting value $rowKey into ${column.name} index")
    indexMap.compute(indexKey, (_, value) =>  {
      value match {
        case null => ImmutableArraySet.of(rowKey)
        case array: ImmutableArraySet[String] => array.+(rowKey)
      }
    })
  }

  override def replace(oldIndexKey: String, newIndexKey: String, rowKey: String): Unit = {
    logger.trace(s"Moving value $rowKey in ${column.name} index")
    indexMap.computeIfPresent(oldIndexKey, (_, value) => {
      if (value.length > 1) {
        value.-(rowKey)
      } else {
        null
      }
    })
    indexMap.compute(newIndexKey, (_, value) =>  {
      value match {
        case null => ImmutableArraySet.of(rowKey)
        case array: ImmutableArraySet[String] => array.+(rowKey)
      }
    })
  }
  
  override def find(indexKey: String): ImmutableArray[String] = {
    logger.debug(s"Hit Index: ${column.name} for key $indexKey")
    val result = indexMap.get(indexKey)
    if (result != null) result.toImmutableArray else empty
  }

  override def find(indexedValues: List[String]): ImmutableArray[String] = super.find(indexedValues)

  override def lessThan(bound: String): ImmutableArray[String] = {
    logger.warn("Less than is not supported for Strings")
    empty
  }

  override def greaterThan(bound: String): ImmutableArray[String] = {
    logger.warn("Greater than is not supported for Strings")
    empty
  }

}

class SkipListIndexedField[TYPE](val column: Column) extends IndexedField[TYPE] with StrictLogging {
  private final val skipList = new ConcurrentSkipListMap[TYPE, ImmutableArraySet[String]]()

  override def remove(indexKey: TYPE, rowKey: String): Unit = {
    logger.trace(s"Removing value $rowKey from ${column.name} index")
    skipList.computeIfPresent(indexKey, (_, value) => {
      if (value.length > 1) {
        value.-(rowKey)
      } else {
        null
      }
    })
  }

  override def replace(oldIndexKey: TYPE, newIndexKey: TYPE, rowKey: String): Unit = {
    logger.trace(s"Moving value $rowKey in ${column.name} index")
    skipList.computeIfPresent(oldIndexKey, (_, value) => {
      if (value.length > 1) {
        value.-(rowKey)
      } else {
        null
      }
    })
    skipList.compute(newIndexKey, (_, value) =>  {
      value match {
        case null => ImmutableArraySet.of(rowKey)
        case array: ImmutableArraySet[String] => array.+(rowKey)
      }
    })
  }
  
  override def insert(indexKey: TYPE, rowKey: String): Unit = {
    logger.trace(s"Inserting value $rowKey into ${column.name} index")
    skipList.compute(indexKey, (_, value) =>  {
      value match {
        case null => ImmutableArraySet.of(rowKey)
        case array: ImmutableArraySet[String] => array.+(rowKey)
      }
    })
  }

  override def find(indexKey: TYPE): ImmutableArray[String] = {
    logger.debug(s"Hit Index: ${column.name} for key $indexKey")
    val result = skipList.get(indexKey)
    if (result != null) result.toImmutableArray else empty
  }

  def lessThan(bound: TYPE): ImmutableArray[String] = {
    logger.debug(s"Hit Index (LT): ${column.name}")
    collect(skipList.headMap(bound, false))
  }

  def lessThanOrEqual(bound: TYPE): ImmutableArray[String] = {
    logger.debug(s"Hit Index (LTE): ${column.name}")
    collect(skipList.headMap(bound, true))
  }

  def greaterThan(bound: TYPE): ImmutableArray[String] = {
    logger.debug(s"Hit Index (GT): ${column.name}")
    collect(skipList.tailMap(bound, false))
  }

  def greaterThanOrEqual(bound: TYPE): ImmutableArray[String] = {
    logger.debug(s"Hit Index (GTE): ${column.name}")
    collect(skipList.tailMap(bound, true))    
  }

  override def find(indexedValues: List[TYPE]): ImmutableArray[String] = super.find(indexedValues)

  private def collect(results: ConcurrentNavigableMap[TYPE, ImmutableArraySet[String]]): ImmutableArray[String] = {
    if (results.isEmpty) {
      empty
    } else if (results.size() == 1) {
      results.firstEntry().getValue.toImmutableArray
    } else {
      val uniqueValues = mutable.HashSet.empty[String]
      val iterator = results.values().iterator()
      while (iterator.hasNext) {
        val set = iterator.next()
        uniqueValues.addAll(set.iterator)
      }
      ImmutableArray.from(uniqueValues)
    }
  }
  
}

class SkipListIndexedDoubleField(column: Column) extends SkipListIndexedField[Double](column) with DoubleIndexedField {}

class SkipListIndexedIntField(column: Column) extends SkipListIndexedField[Int](column) with IntIndexedField {}

class SkipListIndexedLongField(column: Column) extends SkipListIndexedField[Long](column) with LongIndexedField {}

class SkipListIndexedBooleanField(column: Column) extends SkipListIndexedField[Boolean](column) with BooleanIndexedField {}

class SkipListIndexedEpochTimestampField(column: Column) extends SkipListIndexedField[EpochTimestamp](column) with EpochTimestampIndexedField {}

class SkipListIndexedCharField(column: Column) extends SkipListIndexedField[Char](column) with CharIndexedField {}