package org.finos.vuu.feature.ignite

import org.finos.vuu.core.sort.SortDirection
import org.finos.vuu.core.table.{ColumnValueProvider, Columns}
import org.finos.vuu.feature.ViewPortKeys
import org.finos.vuu.net.{FilterSpec, SortDef, SortSpec}
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef
import org.finos.vuu.provider.VirtualizedProvider
import org.finos.vuu.test.{FakeDataSource, FakeInMemoryTable}
import org.finos.vuu.util.schema.{ExternalEntitySchema, SchemaMapperBuilder, SchemaMapperFunctionalTestBase, SchemaTestData}
import org.finos.vuu.viewport.{ViewPort, ViewPortColumns}

class SchemaMapperFunctionalTest  extends SchemaMapperFunctionalTestBase {

  Feature("Filter data in virtualised table using schema mapper") {
    Scenario("When table columns and entity fields has same type") {

      val externalEntitySchema: ExternalEntitySchema = createExternalEntitySchema
      val tableDef = VirtualizedSessionTableDef(
        name = "MyExampleVirtualTable",
        keyField = "id",
        customColumns = Columns.fromExternalSchema(externalEntitySchema)
      )
      val schemaMapper = SchemaMapperBuilder(externalEntitySchema, tableDef.getColumns)
        .build()
      val table = new FakeInMemoryTable("SchemaMapTest", tableDef)

      //simulate using typeahead
      givenColumnQueryReturns("unique", "clientId", Array("5","6"))

      val dataProvider = new TestVirtualProvider(fakeDataSource)
      val columnValueProvider = dataProvider.asInstanceOf[ColumnValueProvider]
      columnValueProvider.getUniqueValues("clientId")

      //todo assert on the result returned for typeahead

      //simulate using user entered filter and sort to the data query
      val filterSpec = FilterSpec("orderId > 1 and ric starts \"ABC\"")
      val sortSpec = SortSpec(List(SortDef("price", SortDirection.Ascending.external)))

      val filterAndSortSpecToSql = FilterAndSortSpecToSql(schemaMapper)
      filterAndSortSpecToSql.sortToSql(sortSpec)
      filterAndSortSpecToSql.filterToSql(filterSpec)

      //todo assert that correct sql query is created - should use real ignite or assert on expected sql query?

      //todo test once query is returned it can be mapped appropriate to table rows & assert on what exist in table
      givenQueryReturns("filtered", List(
        List("testId1", 5, 10.5),
        List("testId2", 6, 11.5),
        List("testId3", 5, 12.5),
      ))
      fakeDataSource.getAsListOfValues("filtered")
    }

    Scenario("When table columns and entity fields has different type"){}
  }
}


class TestVirtualProvider(fakeDataSource:FakeDataSource[SchemaTestData]) extends VirtualizedProvider {
  override def runOnce(viewPort: ViewPort): Unit = ???

  override def getUniqueValues(columnName: String): Array[String] = getColumnQueryResult("unique", columnName)

  override def getUniqueValuesStartingWith(columnName: String, starts: String): Array[String] = ???

  override def subscribe(key: String): Unit = ???

  override def doStart(): Unit = ???

  override def doStop(): Unit = ???

  override def doInitialize(): Unit = ???

  override def doDestroy(): Unit = ???

  override val lifecycleId: String = "SchemaMapperFunctionalTest"

  private def getColumnQueryResult(queryName: String, columnName:String): Array[String] = {
    fakeDataSource.getColumnValues(queryName, columnName)
      .getOrElse(throw new Exception("query does not exist in store. make sure it is setup"))
  }

  override def getUniqueValuesVPColumn(columnName: String, viewPortColumns: ViewPortColumns, vpKeys: ViewPortKeys): Array[String] = ???

  override def getUniqueValuesStartingWithVPColumn(columnName: String, starts: String, viewPortColumns: ViewPortColumns, vpKeys: ViewPortKeys): Array[String] = ???
}
