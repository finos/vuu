package org.finos.vuu.viewport.tree

import org.finos.vuu.core.table.{Column, RowData}
import org.finos.vuu.viewport.{AggregationType, GroupBy}

import java.util

object Aggregation {
  def createAggregations(groupBy: GroupBy): List[NodeAggregation] = {
    groupBy.aggregations.map(agg => agg.aggType match {
      case AggregationType.Sum => new SumAggregation(agg.column)
      case AggregationType.Count => new CountAggregation(agg.column)
      case AggregationType.Average => new AverageAggregation(agg.column)
      case AggregationType.High => new HighAggregation(agg.column)
      case AggregationType.Low => new LowAggregation(agg.column)
    })
  }
}

class AverageAggregation(val column: Column) extends NodeAggregation {
  private var average: Double = 0D
  private var samples: Int = 0

  override def toValue: Any = {
    average
  }
  override def processLeaf(row: RowData): Unit = {
    val colData = column.getData(row)
    if(colData != null){
      val latestValue = colData.toString.toDouble
      average = (average * samples.toDouble + latestValue) / (samples.toDouble + 1)
      samples += 1
    }
  }
}

class HighAggregation(val column: Column) extends NodeAggregation {
  private var value: Double = 0D

  override def toValue: Any = {
    value
  }
  override def processLeaf(row: RowData): Unit = {
    val colData = column.getData(row)
    if(colData != null){
      value = Math.max(value, colData.toString.toDouble)
    }
  }
}

class LowAggregation(val column: Column) extends NodeAggregation {
  private var value: Double = Integer.MAX_VALUE.toDouble

  override def toValue: Any = {
    value
  }
  override def processLeaf(row: RowData): Unit = {
    val colData = column.getData(row)
    if(colData != null){
      value = Math.min(value, colData.toString.toDouble)
    }
  }
}

class SumAggregation(val column: Column) extends NodeAggregation {
  private var value: Double = 0d

  override def toValue: Any = value

  override def processLeaf(row: RowData): Unit = {
    val colData = column.getData(row)

    if (colData != null) {
      value += colData.toString.toDouble
    }
  }
}

class CountAggregation(val column: Column) extends NodeAggregation {
  private val hashSet = new util.HashSet[String]()

  //override def column: Column = ???
  override def toValue: Any = hashSet.size()

  override def processLeaf(row: RowData): Unit = {
    val colData = column.getData(row)

    if (colData != null) {
      if (!hashSet.contains(colData.toString)) hashSet.add(colData.toString)
    }
  }
}

trait NodeAggregation {
  def column: Column

  def toValue: Any

  def processLeaf(row: RowData): Unit

  override def hashCode(): Int = {
    column.name.hashCode + getClass.getName.hashCode
  }

  override def equals(obj: Any): Boolean = {
    obj != null && (this.getClass == obj.getClass) && this.hashCode() == obj.hashCode()
  }
}
