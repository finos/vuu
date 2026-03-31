package org.finos.vuu.util;

import org.finos.vuu.api.Link;
import org.finos.vuu.api.TableDef;
import org.finos.vuu.core.table.Column;
import org.finos.vuu.core.table.SimpleColumn;
import org.finos.vuu.net.SortDef;
import org.finos.vuu.net.SortSpec;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.finos.vuu.util.ScalaCollectionConverter.toScala;
import static org.junit.jupiter.api.Assertions.assertEquals;

class TableDefBuilderTest {

    @Test
    void buildWithAllParameters() {
        TableDef tableDef = new TableDefBuilder()
                .name("myTable")
                .keyField("myKey")
                .customColumns(new Column[]{new SimpleColumn("myColumn", 0, String.class)})
                .joinFields(List.of("myJoinField"))
                .autosubscribe(true)
                .links(List.of(new Link("fromColumn", "toTable", "toColumn")))
                .indexFields(List.of("myIndex"))
                .withPrivateVisibility()
                .includeDefaultColumns(false)
                .permissionFunction(null)
                .defaultSort(new SortSpec(toScala(List.of(new SortDef("myColumn", 'D')))))
                .build();

        assertEquals("myTable", tableDef.name());

    }

}