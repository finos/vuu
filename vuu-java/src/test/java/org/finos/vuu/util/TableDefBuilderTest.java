package org.finos.vuu.util;

import org.finos.vuu.api.Link;
import org.finos.vuu.api.TableDef;
import org.finos.vuu.api.TableVisibility;
import org.finos.vuu.core.table.Column;
import org.finos.vuu.core.table.SimpleColumn;
import org.finos.vuu.net.SortDef;
import org.finos.vuu.net.SortSpec;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.finos.vuu.util.ScalaCollectionConverter.toScala;
import static org.junit.jupiter.api.Assertions.*;

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
                .permissionFunction((a, b) -> null)
                .defaultSort(new SortSpec(toScala(List.of(new SortDef("myColumn", 'D')))))
                .build();

        assertEquals("myTable", tableDef.name());
        assertEquals("myKey", tableDef.keyField());
        assertEquals(1, tableDef.customColumns().length);
        assertEquals(1, tableDef.joinFields().length());
        assertTrue(tableDef.autosubscribe());
        assertEquals(1, tableDef.links().links().length());
        assertEquals(1, tableDef.indices().indices().length());
        assertEquals(TableVisibility.PRIVATE(), tableDef.visibility());
        assertFalse(tableDef.includeDefaultColumns());
        assertNotNull(tableDef.permissionFunction());
        assertEquals(1, tableDef.defaultSort().sortDefs().length());
    }

    @Test
    void buildWithDefaultValues() {
        TableDef tableDef = new TableDefBuilder()
                .name("myTable")
                .keyField("myKey")
                .customColumns(new Column[]{new SimpleColumn("myColumn", 0, String.class)})
                .build();

        assertTrue(tableDef.joinFields().isEmpty());
        assertFalse(tableDef.autosubscribe());
        assertTrue(tableDef.links().links().isEmpty());
        assertTrue(tableDef.indices().indices().isEmpty());
        assertEquals(TableVisibility.PUBLIC(), tableDef.visibility());
        assertTrue(tableDef.includeDefaultColumns());
        assertNotNull(tableDef.permissionFunction());
        assertTrue(tableDef.defaultSort().sortDefs().isEmpty());
    }

}