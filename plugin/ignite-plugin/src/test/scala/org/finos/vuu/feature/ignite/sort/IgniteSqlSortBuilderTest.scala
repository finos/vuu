package org.finos.vuu.feature.ignite.sort

import org.finos.vuu.core.sort.SortDirection
import org.finos.vuu.util.schema.{SchemaField, SchemaMapper}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalamock.scalatest.MockFactory
import org.scalatest.matchers.should.Matchers

class IgniteSqlSortBuilderTest extends AnyFeatureSpec with MockFactory with Matchers {

  private val sortBuilder = new IgniteSqlSortBuilder()
  private val schemaMapper = mock[SchemaMapper]

  Feature("IgniteSqlSortBuilder") {
    Scenario("can create sql order by clause for ignite column with different name") {
      (schemaMapper.externalSchemaField _).expects("parentOrderId").returns(Option(testSchemaField("orderId")))

      val sortSpecInternal = Map("parentOrderId"-> SortDirection.Descending)
      val sortSql = sortBuilder.toSql(sortSpecInternal, schemaMapper)

      sortSql.sqlTemplate shouldEqual "orderId DESC"
    }

    Scenario("can create sql order by clause for multiple ignite columns") {
      (schemaMapper.externalSchemaField _).expects("column1").returns(Option(testSchemaField("column1")))
      (schemaMapper.externalSchemaField _).expects("column2").returns(Option(testSchemaField("column2")))

      val sortSpecInternal = Map(
        "column1" -> SortDirection.Descending,
        "column2" -> SortDirection.Ascending,
      )
      val sortSql = sortBuilder.toSql(sortSpecInternal, schemaMapper)

      sortSql.sqlTemplate shouldEqual "column1 DESC, column2 ASC"
    }

    Scenario("skip sort if no mapping found to ignite columns") {
      (schemaMapper.externalSchemaField _).expects("someTableColumnNotInMap").returns(None)

      val sortSpecInternal = Map("someTableColumnNotInMap" -> SortDirection.Descending)
      val sortSql = sortBuilder.toSql(sortSpecInternal, schemaMapper)

      sortSql.sqlTemplate shouldEqual ""
    }
  }

  private def testSchemaField(name: String) = SchemaField(name, classOf[Any], -1)
}
