package org.finos.vuu.util;

import org.finos.vuu.api.Link;
import org.finos.vuu.api.SessionTableDef;
import org.finos.vuu.api.TableDef;
import org.finos.vuu.core.table.Column;
import org.finos.vuu.core.table.RangeSettings;
import org.finos.vuu.core.table.SimpleColumn;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SessionTableDefBuilderTest {

    @Test
    void buildWithAllParameters() {
        SessionTableDef sessionTableDef = new SessionTableDefBuilder()
                .name("myTable")
                .keyField("myKey")
                .customColumns(new Column[]{new SimpleColumn("myColumn", 0, String.class, false)})
                .joinFields(List.of("myJoinField"))
                .autoSubscribe(true)
                .links(List.of(new Link("fromColumn", "toTable", "toColumn")))
                .indexFields(List.of("myIndex"))
                .defaultSort(new SortSpecBuilder().addAscending("myColumn").build())
                .rangeSettings(RangeSettings.apply().withMaxRangeEnd(100).withMaxRangeWidth(10))
                .build();

        assertEquals("myTable", sessionTableDef.name());
        assertEquals("myKey", sessionTableDef.keyField());
        assertEquals(1, sessionTableDef.customColumns().length);
        assertEquals(1, sessionTableDef.joinFields().length());
        assertTrue(sessionTableDef.autosubscribe());
        assertEquals(1, sessionTableDef.links().links().length());
        assertEquals(1, sessionTableDef.indices().indices().length());
        assertEquals(1, sessionTableDef.defaultSort().sortDefs().length());
        assertEquals(100, sessionTableDef.rangeSettings().maxRangeEnd());
        assertEquals(10, sessionTableDef.rangeSettings().maxRangeWidth());
    }

    @Test
    void buildWithDefaultValues() {
        TableDef tableDef = new TableDefBuilder()
                .name("myTable")
                .keyField("myKey")
                .build();

        assertEquals(0, tableDef.customColumns().length);
        assertTrue(tableDef.joinFields().isEmpty());
        assertFalse(tableDef.autosubscribe());
        assertTrue(tableDef.links().links().isEmpty());
        assertTrue(tableDef.indices().indices().isEmpty());
        assertTrue(tableDef.defaultSort().sortDefs().isEmpty());
        assertEquals(Integer.MAX_VALUE, tableDef.rangeSettings().maxRangeEnd());
        assertEquals(1000, tableDef.rangeSettings().maxRangeWidth());
    }

}