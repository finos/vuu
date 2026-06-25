package org.finos.vuu.util;

import org.finos.vuu.api.Link;
import org.finos.vuu.api.SessionTableDef;
import org.finos.vuu.api.TableDef;
import org.finos.vuu.core.table.Column;
import org.finos.vuu.core.table.SimpleColumn;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

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
                .build();

        assertEquals("myTable", sessionTableDef.name());
        assertEquals("myKey", sessionTableDef.keyField());
        assertEquals(1, sessionTableDef.customColumns().length);
        assertEquals(1, sessionTableDef.joinFields().length());
        assertTrue(sessionTableDef.autosubscribe());
        assertEquals(1, sessionTableDef.links().links().length());
        assertEquals(1, sessionTableDef.indices().indices().length());
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
    }

}