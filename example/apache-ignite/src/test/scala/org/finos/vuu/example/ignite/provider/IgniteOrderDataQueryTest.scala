package org.finos.vuu.example.ignite.provider

import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.sort.SortDirection
import org.finos.vuu.core.table.{Column, Columns}
import org.finos.vuu.example.ignite.IgniteOrderStore
import org.finos.vuu.example.ignite.provider.IgniteOrderDataQueryTest.{entitySchema, internalColumns, internalColumnsByExternalFields}
import org.finos.vuu.feature.ignite.IgniteSqlQuery
import org.finos.vuu.net.{FilterSpec, SortDef, SortSpec}
import org.finos.vuu.util.schema.{ExternalEntitySchema, ExternalEntitySchemaBuilder, SchemaMapperBuilder}
import org.scalamock.scalatest.MockFactory
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class IgniteOrderDataQueryTest extends AnyFeatureSpec with Matchers with MockFactory {


  private val schemaMapper = SchemaMapperBuilder(entitySchema, internalColumns)
    .withFieldsMap(internalColumnsByExternalFields)
    .build()
  private val igniteStore: IgniteOrderStore = mock[IgniteOrderStore]
  private val igniteDataQuery = IgniteOrderDataQuery(igniteStore, schemaMapper)

  Feature("fetch") {

    Scenario("can parse and apply filter and sort spec") {
      val filterSpec = FilterSpec("id = 2 and name != \"ABC\"")
      val sortSpec = SortSpec(List(SortDef("value", SortDirection.Ascending.external)))

      (igniteStore.findChildOrder _)
        .expects(IgniteSqlQuery("(key = ? AND name != ?)", List(2, "ABC")), IgniteSqlQuery("value ASC"), *, *).once()

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

  val entitySchema: ExternalEntitySchema = ExternalEntitySchemaBuilder().withEntity(classOf[TestDto]).build()
}