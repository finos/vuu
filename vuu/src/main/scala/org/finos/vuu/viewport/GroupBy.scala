package org.finos.vuu.viewport

import org.finos.vuu.core.table.Column
import org.finos.vuu.feature.spec.table.DataTable


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

case class GroupBy(columns: List[Column], aggregations: List[Aggregation])

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