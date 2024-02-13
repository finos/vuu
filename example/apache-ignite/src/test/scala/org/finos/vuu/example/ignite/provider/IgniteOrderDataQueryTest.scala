package org.finos.vuu.example.ignite.provider

import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.sort.SortDirection
import org.finos.vuu.core.table.{Column, Columns}
import org.finos.vuu.example.ignite.IgniteOrderStore
import org.finos.vuu.example.ignite.provider.IgniteOrderDataQueryTest.{entitySchema, internalColumns, internalColumnsByExternalFields}
import org.finos.vuu.feature.ignite.schema.{ExternalEntitySchemaBuilder, ExternalEntitySchema, SchemaMapper}
import org.finos.vuu.net.FilterSpec
import org.scalamock.scalatest.MockFactory
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class IgniteOrderDataQueryTest extends AnyFeatureSpec with Matchers with MockFactory {

  private val igniteStore: IgniteOrderStore = mock[IgniteOrderStore]
  private val schemaMapper = SchemaMapper(entitySchema, internalColumns, internalColumnsByExternalFields)
  private val igniteDataQuery = IgniteOrderDataQuery(igniteStore, schemaMapper)

  Feature("fetch") {

    Scenario("can parse and apply filter and sort spec") {
      val filterSpec = FilterSpec("id = 2 and name != \"ABC\"")
      val sortSpec = Map("value" -> SortDirection.Ascending)

      (igniteStore.findChildOrder _).expects("(key = 2 AND name != 'ABC')", "value ASC", *, *).once()

      igniteDataQuery.fetch(filterSpec, sortSpec, 0, 0)
    }
  }
}

private case class TestDto(key: Int, name: String, value: Int)

private object IgniteOrderDataQueryTest {
  val internalColumns: Array[Column] = Columns.fromNames("id".int(), "name".string(), "value".string())

  val internalColumnsByExternalFields: Map[String, String] = Map(
    "key" -> "id",
    "name" -> "name",
    "value" -> "value",
  )

  val entitySchema: ExternalEntitySchema = ExternalEntitySchemaBuilder().withCaseClass[TestDto].build()
}