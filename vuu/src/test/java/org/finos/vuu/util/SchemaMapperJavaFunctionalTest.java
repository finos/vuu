package org.finos.vuu.util;


import org.finos.toolbox.time.Clock;
import org.finos.toolbox.time.TestFriendlyClock;
import org.finos.vuu.api.ColumnBuilder;
import org.finos.vuu.api.TableDef;
import org.finos.vuu.core.table.Columns;
import org.finos.vuu.core.table.RowWithData;
import org.finos.vuu.test.FakeDataSource;
import org.finos.vuu.test.FakeInMemoryTable;
import org.finos.vuu.util.schema.ExternalEntitySchemaBuilder;
import org.finos.vuu.util.schema.SchemaMapper;
import org.finos.vuu.util.schema.SchemaMapperBuilder;
import org.junit.Before;
import org.junit.Test;
import org.junit.experimental.runners.Enclosed;
import org.junit.runner.RunWith;
import scala.jdk.javaapi.OptionConverters;

import java.util.List;
import java.util.Map;

import static org.finos.vuu.util.ScalaCollectionConverter.*;
import static org.junit.Assert.assertEquals;


@RunWith(Enclosed.class)
public class SchemaMapperJavaFunctionalTest {

    private static String queryName = "myQuery";
    private static FakeDataSource<SchemaJavaTestData> dataSource = new FakeDataSource<>();
    private static Clock clock  = new TestFriendlyClock(10001L);

    @Before
    public void setUp() {
        queryName += java.util.UUID.randomUUID().toString(); // unique query name for each test run
    }

    public static class UpdateInMemoryTable {
        @Test
        public void when_table_columns_and_entity_fields_match_exactly() throws Exception {

            var externalEntitySchema = ExternalEntitySchemaBuilder.apply()
                    .withEntity(SchemaJavaTestData.class)
                    .withIndex("ID_INDEX", toScala(List.of("Id")))
                    .build();
            var tableDef = TableDef.apply(
                    "MyJavaExampleTable",
                    "Id",
                    Columns.fromExternalSchema(externalEntitySchema),
                    toScalaSeq(List.of())
            );
            var schemaMapper = SchemaMapperBuilder.apply(externalEntitySchema, tableDef.columns())
                    .build();
            var table = new FakeInMemoryTable("SchemaMapJavaTest", tableDef);
            dataSource.setUpResultAsListOfValues(
                    queryName,
                    ScalaList.of(ScalaList.of("testId1", 5, 10.5))
            );

            getDataAndUpdateTable(queryName, schemaMapper, table);

            var existingRows = toJava(table.pullAllRows());
            assertEquals(existingRows.size(), 1);
            assertEquals(existingRows.get(0).get("Id"), "testId1");
            assertEquals(existingRows.get(0).get("ClientId"), 5);
            assertEquals(existingRows.get(0).get("NotionalValue"), 10.5);
        }

        @Test
        public void when_table_columns_and_entity_fields_does_not_match_exactly() throws Exception {

            var externalEntitySchema = ExternalEntitySchemaBuilder.apply()
                    .withEntity(SchemaJavaTestData.class)
                    .withIndex("ID_INDEX", toScala(List.of("Id")))
                    .build();
            var tableDef = TableDef.apply(
                    "MyJavaExampleTable",
                    "Id",
                    new ColumnBuilder()
                            .addDouble("SomeOtherName")
                            .addString("Id")
                            .addInt("ClientId")
                            .build(),
                    toScalaSeq(List.of())
            );
            var schemaMapper = SchemaMapperBuilder.apply(externalEntitySchema, tableDef.columns())
                    .withFieldsMap(
                            toScala(Map.of("Id", "Id",
                                            "ClientId", "ClientId",
                                            "NotionalValue", "SomeOtherName"
                                    ))
                    )
                    .build();
            var table = new FakeInMemoryTable("SchemaMapJavaTest", tableDef);
            dataSource.setUpResultAsListOfValues(
                    queryName,
                    ScalaList.of(ScalaList.of("testId1", 5, 10.5))
            );

            getDataAndUpdateTable(queryName, schemaMapper, table);

            var existingRows = toJava(table.pullAllRows());
            assertEquals(existingRows.size(), 1);
            assertEquals(existingRows.get(0).get("Id"), "testId1");
            assertEquals(existingRows.get(0).get("ClientId"), 5);
            assertEquals(existingRows.get(0).get("SomeOtherName"), 10.5);

        }
    }

    private static void getDataAndUpdateTable(String queryName, SchemaMapper schemaMapper, FakeInMemoryTable table) throws Exception {
        //todo should use fake java store which is more likely usecase and avoid all the type conversions?
        var keyFieldName = table.getTableDef().keyField();
        getQueryResult(queryName).stream()
                .map(valueList -> mapToRows(schemaMapper, valueList, keyFieldName))
                .forEach(row -> table.processUpdate(row.key(), row, clock.now()));
    }

    private static RowWithData mapToRows(SchemaMapper schemaMapper, List<Object> valueList, String keyFieldName) {
        var rowMap = schemaMapper.toInternalRowMap(toScala(valueList));
        var keyOptional = OptionConverters.toJava(rowMap.get(keyFieldName));
        var key = keyOptional.orElseThrow();
        return new RowWithData(key.toString(), rowMap);
    }

    private static List<List<Object>> getQueryResult(String queryName) throws Exception {
        var result = OptionConverters.toJava(dataSource.getAsListOfValues(queryName))
                        .map(listOfLists -> toJava(listOfLists.map(ScalaCollectionConverter::toJava).toList()))
                        .orElseThrow(() -> new Exception("Query does not exist in store. make sure it is setup"));
        return result;
    }
}
