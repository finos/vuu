package org.finos.vuu.util;

import org.finos.vuu.api.ColumnBuilder;
import org.finos.vuu.api.TableDef;
import org.finos.vuu.test.FakeIgniteStore;
import org.finos.vuu.test.SchemaTestData;
import org.finos.vuu.util.schema.ExternalEntitySchemaBuilder;
import org.finos.vuu.util.schema.SchemaMapperBuilder;
import org.finos.vuu.util.schema.SchemaMapperBuilder$;
import scala.collection.immutable.Seq;

import java.util.List;

import static org.finos.vuu.util.ScalaCollectionConverter.toScala;
import static org.finos.vuu.util.ScalaCollectionConverter.toScalaSeq;

public class SchemaJavaExample {
    public void doSomething(){

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
                .withIndex("ID_INDEX", toScala( List.of("id")))
                .build();

        //create schema mapper
        var schemaMapper = SchemaMapperBuilder.apply(externalEntitySchema, tableDef.columns())
                //.withFieldsMap(columnNameByExternalField)
                .build();

        //get data from ignite as list of varues
        var queryName = "myQuery";
        var igniteStore = new FakeIgniteStore();
        igniteStore.setUpSqlFieldsQuery(
                queryName,
                toScala(List.of(
                        toScala(List.of("id1", 10.5))
                ))
//                ScalaList.of(
//                        ScalaList.of("id1", 10.5)
//               )
            );

//        List<List<Object>> result = igniteStore.getSqlFieldsQuery(queryName)
//                .getOrElse(throw new Exception("query does not exist in store. make sure it is setup"));

        // map to entity object - as order of values are relevant to how the query schema was defined
//        var tableRowMap1 = result
//                .map(rowData => mapToEntity(rowData))
//            .map(externalEntity => schemaMapper.toInternalRowMap(externalEntity));

//        var tableRowMap2 =
//        result.map(rowData => schemaMapper.toInternalRowMap(rowData));
//
//        //map to tablerow
//        var keyFieldName = tableDef.keyField;
//        var tableRows = tableRowMap2.map(rowMap => {
//                var keyvarue = rowMap(keyFieldName).toString
//                RowWithData(keyvarue, rowMap)
//        });
//
//        //update table with table row?
//        var table = new FakeInMemoryTable("SchemaMapTest", tableDef);
//        tableRows.foreach(row => table.processUpdate(row.key, row));
//
//        //assert on reading the table row - is that possible or need to use mock table with table interface
//        var existingRows = table.pullAllRows();
    }


    //todo different for java
//    private def mapToEntity(rowData: List[Any]): SchemaTestData =
//    getListToObjectConverter[SchemaTestData](SchemaTestData)(rowData)


}


