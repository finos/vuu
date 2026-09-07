package org.finos.vuu.api;

import org.finos.vuu.core.table.Column;
import org.finos.vuu.core.table.RangeSettings;
import org.finos.vuu.core.table.SimpleColumn;
import org.finos.vuu.net.SortDef;
import org.finos.vuu.net.SortSpec;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.finos.vuu.util.ScalaCollectionConverter.toScala;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JoinTableDefBuilderTest {

    private final TableDef baseTable = new TableDefBuilder()
            .name("myTable")
            .keyField("myKey")
            .build();
    private final TableDef rightTable = new TableDefBuilder()
            .name("myTable2")
            .keyField("myKey")
            .build();

    @Test
    void buildWithAllParameters() {
        JoinTableDef tableDef = new JoinTableDefBuilder()
                .name("myTable")
                .baseTable(baseTable)
                .joinTos(List.of(JoinTo.apply(rightTable, JoinSpec.apply(
                        "myKey", "myKey", LeftOuterJoin$.MODULE$
                ))))
                .joinColumns(new Column[]{new SimpleColumn("myColumn", 0, String.class, false)})
                .joinFields(List.of("myJoinField"))
                .links(List.of(new Link("fromColumn", "toTable", "toColumn")))
                .indexFields(List.of("myIndex"))
                .withPrivateVisibility()
                .isEditable(true)
                .permissionFunction((a, b) -> null)
                .defaultSort(new SortSpec(toScala(List.of(new SortDef("myColumn", 'D')))))
                .rangeSettings(RangeSettings.apply().withMaxRangeEnd(100).withMaxRangeWidth(10))
                .build();

        assertEquals("myTable", tableDef.name());
        assertEquals("myKey", tableDef.keyField());
        assertEquals(1, tableDef.joinColumns().length);
        assertEquals(1, tableDef.joins().length());
        assertEquals(1, tableDef.options().joinFields().length());
        assertFalse(tableDef.options().autoSubscribe());
        assertEquals(1, tableDef.options().links().links().length());
        assertEquals(1, tableDef.options().indices().indices().length());
        assertEquals(TableVisibility.PRIVATE(), tableDef.options().visibility());
        assertFalse(tableDef.options().includeDefaultColumns());
        assertTrue(tableDef.options().isEditable());
        assertNotNull(tableDef.options().permissionFunction());
        assertEquals(1, tableDef.options().defaultSort().sortDefs().length());
        assertEquals(100, tableDef.options().rangeSettings().maxRangeEnd());
        assertEquals(10, tableDef.options().rangeSettings().maxRangeWidth());
    }

    @Test
    void buildWithDefaultValues() {
        JoinTableDef tableDef = new JoinTableDefBuilder()
                .name("myTable")
                .baseTable(baseTable)
                .build();

        assertEquals(0, tableDef.joinColumns().length);
        assertEquals(0, tableDef.joins().length());
        assertTrue(tableDef.options().joinFields().isEmpty());
        assertFalse(tableDef.options().autoSubscribe());
        assertTrue(tableDef.options().links().links().isEmpty());
        assertTrue(tableDef.options().indices().indices().isEmpty());
        assertEquals(TableVisibility.PUBLIC(), tableDef.options().visibility());
        assertFalse(tableDef.options().includeDefaultColumns());
        assertFalse(tableDef.options().isEditable());
        assertNotNull(tableDef.options().permissionFunction());
        assertTrue(tableDef.options().defaultSort().sortDefs().isEmpty());
        assertEquals(Integer.MAX_VALUE, tableDef.options().rangeSettings().maxRangeEnd());
        assertEquals(1000, tableDef.options().rangeSettings().maxRangeWidth());
    }

}