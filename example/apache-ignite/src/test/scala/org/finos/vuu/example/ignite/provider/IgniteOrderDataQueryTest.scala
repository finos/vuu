package org.finos.vuu.example.ignite.provider

import org.finos.vuu.core.sort.SortDirection
import org.finos.vuu.core.table.{Column, SimpleColumn}
import org.finos.vuu.example.ignite.IgniteOrderStore
import org.finos.vuu.example.ignite.schema.IgniteEntitySchemaBuilder
import org.finos.vuu.feature.ignite.schema.SchemaMapper
import org.finos.vuu.net.FilterSpec
import org.scalamock.scalatest.MockFactory
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class IgniteOrderDataQueryTest extends AnyFeatureSpec with Matchers with MockFactory {

  private val igniteStore: IgniteOrderStore = mock[IgniteOrderStore]
  private val schemaMapper = SchemaMapper(entitySchema, externalFieldByColumns)
  private val igniteDataQuery = IgniteOrderDataQuery(igniteStore, schemaMapper)

  Feature("toInternalRow") {
    val testEntity = TestDto(1, "TestDto", 100)

    Scenario("can convert a dto to internal row representation") {
      val internalKey = "id"

      val res = igniteDataQuery.toInternalRow(internalKey)(testEntity)

      res._1 shouldEqual "1"
      res._2 shouldEqual Map("id" -> testEntity.key, "name" -> testEntity.name, "value" -> testEntity.value)
    }
  }

  Feature("fetch") {

    Scenario("can parse and apply filter and sort spec") {
      val filterSpec = FilterSpec("id = 2 and name != \"ABC\"")
      val sortSpec = Map("value" -> SortDirection.Ascending)

      (igniteStore.findChildOrder _).expects("(key = 2 AND name != 'ABC')", "value ASC", *, *).once()

      igniteDataQuery.fetch(filterSpec, sortSpec, 0, 0)
    }
  }

  private def externalFieldByColumns: Map[String, Column] = Map(
    "key" -> SimpleColumn("id", 0, classOf[Int]),
    "name" -> SimpleColumn("name", 1, classOf[String]),
    "value" -> SimpleColumn("value", 2, classOf[String]),
  )

  private def entitySchema = IgniteEntitySchemaBuilder().withCaseClass[TestDto].build()
}

private case class TestDto(key: Int, name: String, value: Int)
