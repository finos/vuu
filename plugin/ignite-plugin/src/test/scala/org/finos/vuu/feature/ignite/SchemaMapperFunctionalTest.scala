package org.finos.vuu.feature.ignite

import org.finos.vuu.core.sort.SortDirection
import org.finos.vuu.core.table.{ColumnValueProvider, Columns}
import org.finos.vuu.net.FilterSpec
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef
import org.finos.vuu.provider.VirtualizedProvider
import org.finos.vuu.test.{FakeDataSource, FakeInMemoryTable}
import org.finos.vuu.util.schema.{ExternalEntitySchema, SchemaMapperBuilder, SchemaMapperFunctionalTestBase, SchemaTestData}
import org.finos.vuu.viewport.ViewPort

class SchemaMapperFunctionalTest  extends SchemaMapperFunctionalTestBase {

  Feature("Filter data in virtualised table using schema mapper") {
    Scenario("When table columns and entity fields has same type") {

      val externalEntitySchema: ExternalEntitySchema = createExternalEntitySchema
      val tableDef = VirtualizedSessionTableDef(
        name = "MyExampleVirtualTable",
        keyField = "id",
        columns = Columns.fromExternalSchema(externalEntitySchema)
      )
      val schemaMapper = SchemaMapperBuilder(externalEntitySchema, tableDef.columns)
        .build()
      val table = new FakeInMemoryTable("SchemaMapTest", tableDef)


      //trigger type ahead and get data from data source, replicate returning it as table column type
      givenQueryReturns("unique", List(
        List("testId1", 5, 10.5),
        List("testId2", 6, 11.5),
        List("testId3", 5, 12.5),
      ))
      val dataProvider = new TestVirtualProvider(fakeDataSource)
      val columnValueProvider = dataProvider.asInstanceOf[ColumnValueProvider]
      columnValueProvider.getUniqueValues("clientId")
      //todo need to convert to column type before sending results to ui if different from schema type

      //get user specified filter spec, run through antler parser and all the way to datasource query and return result


      //todo does these tests need to use real ignite?

      val filterAndSortSpecToSql = FilterAndSortSpecToSql(schemaMapper)


      val filterSpec = FilterSpec("orderId > 1 and ric starts \"ABC\"")
      val sortSpec = Map("price" -> SortDirection.Ascending)

      givenQueryReturns("filtered", List(
        List("testId1", 5, 10.5),
        List("testId2", 6, 11.5),
        List("testId3", 5, 12.5),
      ))

      fakeDataSource.getAsListOfValues("filtered")
    }
  }
}


class TestVirtualProvider(fakeDataSource:FakeDataSource[SchemaTestData]) extends VirtualizedProvider {
  override def runOnce(viewPort: ViewPort): Unit = ???

  override def getUniqueValues(columnName: String): Array[String] = fakeDataSource.getAsListOfValues("unique")

  override def getUniqueValuesStartingWith(columnName: String, starts: String): Array[String] = ???

  override def subscribe(key: String): Unit = ???

  override def doStart(): Unit = ???

  override def doStop(): Unit = ???

  override def doInitialize(): Unit = ???

  override def doDestroy(): Unit = ???

  override val lifecycleId: String = ???
}
