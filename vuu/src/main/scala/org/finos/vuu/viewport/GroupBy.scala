package org.finos.vuu.viewport

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.{Column, DataTable, RowData}
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.viewport.tree.NodeAggregation

import java.util
import java.util.concurrent.ConcurrentHashMap
import java.util.{Objects, LinkedList as JList}
import scala.jdk.CollectionConverters.*




object GroupBy {
  def apply(table: DataTable, columns: Column*): GroupByClause = {
    GroupByClause(table, columns.toList)
  }
}

object AggregationType {
  val Sum: Short = 1
  val Average: Short = 2
  val Count: Short = 3
  val High: Short = 4
  val Low: Short = 5
  val Distinct: Short = 6
}

case class Aggregation(column: Column, aggType: Short)

case class GroupBy(columns: List[Column], aggregations: List[Aggregation]) {

  private lazy val hash = Objects.hash(columns, aggregations)

  override def hashCode(): Int = hash

}

object NoGroupBy extends GroupBy(List(), List())

case class GroupByClause(table: DataTable, columns: List[Column], aggregations: List[Aggregation] = List()) {
  def withSum(fields: String*): GroupByClause = this.copy(aggregations = aggregations ++ table.columnsForNames(fields.toList).map(Aggregation(_, AggregationType.Sum)))
  def withAverage(fields: String*): GroupByClause = this.copy(aggregations = aggregations ++ table.columnsForNames(fields.toList).map(Aggregation(_, AggregationType.Average)))
  def withHigh(fields: String*): GroupByClause = this.copy(aggregations = aggregations ++ table.columnsForNames(fields.toList).map(Aggregation(_, AggregationType.High)))
  def withLow(fields: String*): GroupByClause = this.copy(aggregations = aggregations ++ table.columnsForNames(fields.toList).map(Aggregation(_, AggregationType.Low)))
  def withCount(fields: String*): GroupByClause = this.copy(aggregations = aggregations ++ table.columnsForNames(fields.toList).map(Aggregation(_, AggregationType.Count)))
  def withDistinct(fields: String*): GroupByClause = this.copy(aggregations = aggregations ++ table.columnsForNames(fields.toList).map(Aggregation(_, AggregationType.Distinct)))

  def asClause(): GroupBy = GroupBy(columns, aggregations)
}