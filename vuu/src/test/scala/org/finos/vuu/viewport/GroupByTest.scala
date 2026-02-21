package org.finos.vuu.viewport

import org.finos.vuu.core.table.{DataType, SimpleColumn}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.util.Objects

class GroupByTest extends AnyFeatureSpec with Matchers {

  Feature("Boilerplate") {

    Scenario("Hashcode") {
      val column = SimpleColumn("parentOrderId", 0, DataType.IntegerDataType)
      val aggregation = Aggregation.apply(column, AggregationType.Sum)
      val groupBy = GroupBy(List(column), List(aggregation))

      Objects.hash(List(column), List(aggregation)) shouldEqual groupBy.hashCode()
    }

  }
  
}
