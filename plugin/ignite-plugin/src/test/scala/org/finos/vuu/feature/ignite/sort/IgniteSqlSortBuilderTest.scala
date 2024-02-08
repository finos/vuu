package org.finos.vuu.feature.ignite.sort

import org.finos.vuu.core.sort.SortDirection
import org.finos.vuu.feature.ignite.schema.{SchemaField, SchemaMapper}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalamock.scalatest.MockFactory

class IgniteSqlSortBuilderTest extends AnyFeatureSpec with MockFactory {

  private val sortBuilder = new IgniteSqlSortBuilder()
  private val schemaMapper = mock[SchemaMapper]

  Feature("IgniteSqlSortBuilder") {
    Scenario("can create sql order by clause for ignite column with different name") {
      (schemaMapper.externalSchemaField _).expects("parentOrderId").returns(Option(testSchemaField("orderId")))

      val sortSpecInternal = Map("parentOrderId"-> SortDirection.Descending)
      val sortSql = sortBuilder.toSql(sortSpecInternal, schemaMapper)

      assert(sortSql == "orderId DESC")
    }

    Scenario("can create sql order by clause for multiple ignite columns") {
      (schemaMapper.externalSchemaField _).expects("column1").returns(Option(testSchemaField("column1")))
      (schemaMapper.externalSchemaField _).expects("column2").returns(Option(testSchemaField("column2")))

      val sortSpecInternal = Map(
        "column1" -> SortDirection.Descending,
        "column2" -> SortDirection.Ascending,
      )
      val sortSql = sortBuilder.toSql(sortSpecInternal, schemaMapper)

      assert(sortSql == "column1 DESC, column2 ASC")
    }

    Scenario("skip sort if no mapping found to ignite columns") {
      (schemaMapper.externalSchemaField _).expects("someTableColumnNotInMap").returns(None)

      val sortSpecInternal = Map("someTableColumnNotInMap" -> SortDirection.Descending)
      val sortSql = sortBuilder.toSql(sortSpecInternal, schemaMapper)

      assert(sortSql == "")
    }
  }

  private def testSchemaField(name: String) = SchemaField(name, classOf[Any], -1)
}
