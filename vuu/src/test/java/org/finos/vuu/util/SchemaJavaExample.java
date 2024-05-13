package org.finos.vuu.util;

import org.finos.vuu.api.ColumnBuilder;
import org.finos.vuu.api.TableDef;
import org.finos.vuu.core.table.RowWithData;
import org.finos.vuu.test.FakeIgniteStore;
import org.finos.vuu.test.FakeInMemoryTable;
import org.finos.vuu.util.schema.ExternalEntitySchemaBuilder;
import org.finos.vuu.util.schema.SchemaMapperBuilder;
import scala.jdk.javaapi.OptionConverters;

import java.util.List;

import static org.finos.vuu.util.ScalaCollectionConverter.*;

public class SchemaJavaExample {

    public static void main(String[] args) throws Exception {

        doSomething();
    }
    public static void doSomething() throws Exception {

        //create table def
        var tableDef = TableDef.apply(
                "MyExampleTable",
                "Id",
                new ColumnBuilder()
                        .addString("Id")
                        .addDouble("NotionalValue")
                        .build(),
                toScalaSeq(List.of())
        );


        //create entity schema
        var externalEntitySchema = ExternalEntitySchemaBuilder.apply()
                .withEntity(SchemaJavaTestData.class)
                .withIndex("ID_INDEX", toScala( List.of("Id")))
                .build();

        //create schema mapper
        var schemaMapper = SchemaMapperBuilder.apply(externalEntitySchema, tableDef.columns())
                //.withFieldsMap(columnNameByExternalField)
                .build();

        //get data from ignite as list of values
        var queryName = "myQuery";
        var igniteStore = new FakeIgniteStore();
        igniteStore.setUpSqlFieldsQuery(
                queryName,
                ScalaList.of(ScalaList.of("id1", 10.5))
            );

        //todo should use fake java store?
        List<List<Object>> result =
                OptionConverters.toJava(igniteStore.getSqlFieldsQuery(queryName))
                        .map(listOfLists -> toJava(listOfLists.map(ScalaCollectionConverter::toJava).toList()))
                        .orElseThrow(()-> new Exception("query does not exist in store. make sure it is setup"));

        // map to entity object  and then to row

        //map to row directly
        var tableRowMap = result.stream()
                .map(rowData ->
                        schemaMapper.toInternalRowMap(toScala(rowData)
                        ));
                //.map(rowMap -> toJava(rowMap));

        //map to tablerow
        var keyFieldName = tableDef.keyField();
        var tableRows = tableRowMap.map(rowMap -> {
                var keyValue = rowMap.get(keyFieldName).toString();
                return new RowWithData(keyValue, rowMap);
        });

        //update table with table row?
        var table = new FakeInMemoryTable("SchemaMapJavaTest", tableDef);
        tableRows.forEach(row -> table.processUpdate(row.key(), row, 0)); //todo use clock now

        //assert on reading the table row - is that possible or need to use mock table with table interface
        var existingRows = table.pullAllRows();
    }


    //todo different for java
//    private def mapToEntity(rowData: List[Any]): SchemaTestData =
//    getListToObjectConverter[SchemaTestData](SchemaTestData)(rowData)


}


