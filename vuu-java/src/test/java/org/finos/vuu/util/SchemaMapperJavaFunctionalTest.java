package org.finos.vuu.util;

import org.finos.vuu.api.ColumnBuilder;
import org.finos.vuu.api.TableDef;
import org.finos.vuu.core.table.Columns;
import org.finos.vuu.core.table.RowWithData;
import org.finos.vuu.test.FakeInMemoryTable;
import org.finos.vuu.util.schema.ExternalEntitySchemaBuilder;
import org.finos.vuu.util.schema.SchemaMapper;
import org.finos.vuu.util.schema.SchemaMapperBuilder;
import org.finos.vuu.util.types.TypeConverter;
import org.finos.vuu.util.types.TypeConverterContainerBuilder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import scala.jdk.javaapi.OptionConverters;
import test.helper.FakeDataSource;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.finos.vuu.util.ScalaCollectionConverter.toScala;
import static org.finos.vuu.util.ScalaCollectionConverter.toScalaSeq;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class SchemaMapperJavaFunctionalTest {

    private static String queryName = "myQuery";
    private static final FakeDataSource dataSource = new FakeDataSource();

    @BeforeEach
    public void setUp() {
        queryName += java.util.UUID.randomUUID().toString(); // unique query name for each test run
    }

    @Nested
    class UpdateInMemoryTable {
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
                    List.of(List.of("testId1", 5, 10.5))
            );

            getDataAndUpdateTable(queryName, schemaMapper, table);

            var existingRows = table.pullAllRows();
            assertEquals(1, existingRows.size());
            var exitingFirstRow = existingRows.iterator().next();
            assertEquals("testId1", exitingFirstRow.get("Id"));
            assertEquals(5, exitingFirstRow.get("ClientId"));
            assertEquals(10.5, exitingFirstRow.get("NotionalValue"));
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
                    List.of(List.of("testId1", 5, 10.5))
            );

            getDataAndUpdateTable(queryName, schemaMapper, table);

            var existingRows = table.pullAllRows();
            assertEquals(1, existingRows.size());
            var exitingFirstRow = existingRows.iterator().next();
            assertEquals("testId1", exitingFirstRow.get("Id"));
            assertEquals(5, exitingFirstRow.get("ClientId"));
            assertEquals(10.5, exitingFirstRow.get("SomeOtherName"));

        }

        @Test
        public void when_table_columns_and_entity_fields_has_different_types() throws Exception {

            var externalEntitySchema = ExternalEntitySchemaBuilder.apply()
                    .withField("Id", Integer.class)
                    .withField("decimalValue", BigDecimal.class)
                    .withIndex("ID_INDEX", toScala(List.of("Id")))
                    .build();
            var tableDef = TableDef.apply(
                    "MyJavaExampleTable",
                    "Id",
                    new ColumnBuilder()
                            .addString("Id")
                            .addDouble("doubleValue")
                            .build(),
                    toScalaSeq(List.of())
            );
            var typeConverterContainer = TypeConverterContainerBuilder.apply()
                    .withConverter(TypeConverter.apply(BigDecimal.class, Double.class, BigDecimal::doubleValue))
                    .withConverter(TypeConverter.apply(Double.class, BigDecimal.class, v -> new BigDecimal(v.toString())))
                    .build();
            var schemaMapper = SchemaMapperBuilder.apply(externalEntitySchema, tableDef.columns())
                    .withFieldsMap(
                            toScala(Map.of("Id", "Id",
                                    "decimalValue","doubleValue"
                            ))
                    )
                    .withTypeConverters(typeConverterContainer)
                    .build();
            var table = new FakeInMemoryTable("SchemaMapJavaTest", tableDef);
            dataSource.setUpResultAsListOfValues(
                    queryName,
                    List.of(List.of(10, new BigDecimal("1.0001")))
            );

            getDataAndUpdateTable(queryName, schemaMapper, table);

            var existingRows = table.pullAllRows();
            assertEquals(1, existingRows.size());
            var exitingFirstRow = existingRows.iterator().next();
            assertEquals("10", exitingFirstRow.get("Id"));
            assertEquals(1.0001d, exitingFirstRow.get("doubleValue"));
        }
    }

    private static void getDataAndUpdateTable(String queryName, SchemaMapper schemaMapper, FakeInMemoryTable table) throws Exception {
        //todo should use fake java store which is more likely usecase and avoid all the type conversions?
        var keyFieldName = table.getTableDef().keyField();
        getQueryResult(queryName).stream()
                .map(rowValues -> mapToRow(schemaMapper, rowValues, keyFieldName))
                .forEach(row -> table.processUpdate(row.key(), row));
    }

    private static RowWithData mapToRow(SchemaMapper schemaMapper, List<Object> valueList, String keyFieldName) {
        var rowMap = schemaMapper.toInternalRowMap(toScala(valueList));
        return new RowWithData(getKeyValue(keyFieldName, rowMap), rowMap);
    }

    private static String getKeyValue(String keyFieldName, scala.collection.immutable.Map<String, Object> rowMap) {
        return OptionConverters.toJava(rowMap.get(keyFieldName))
                .map(Object::toString)
                .orElseThrow();
    }

    private static List<List<Object>> getQueryResult(String queryName) throws Exception {
        return dataSource.getAsListOfValues(queryName)
                        .orElseThrow(() -> new Exception("Query does not exist in store. make sure it is setup"));
    }
}
