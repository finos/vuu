package org.finos.vuu.util;

import org.finos.vuu.net.SortDef;
import org.finos.vuu.net.SortSpec;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SortSpecBuilderTest {

    @Test
    void buildWithSortDef() {
        SortSpec sortSpec = new SortSpecBuilder()
                .addSortDef(new SortDef("myColumn", 'D'))
                .build();

        assertEquals(1, sortSpec.sortDefs().length());
        assertEquals("myColumn", sortSpec.sortDefs().apply(0).column());
        assertEquals('D', sortSpec.sortDefs().apply(0).sortType());
    }

    @Test
    void buildWithSortDefs() {
        SortSpec sortSpec = new SortSpecBuilder()
                .addSortDefs(
                        List.of(
                                new SortDef("myColumn", 'D'),
                                new SortDef("myColumn2", 'A')
                        ))
                .build();

        assertEquals(2, sortSpec.sortDefs().length());
        assertEquals("myColumn", sortSpec.sortDefs().apply(0).column());
        assertEquals('D', sortSpec.sortDefs().apply(0).sortType());
        assertEquals("myColumn2", sortSpec.sortDefs().apply(1).column());
        assertEquals('A', sortSpec.sortDefs().apply(1).sortType());
    }

    @Test
    void buildWithAscending() {
        SortSpec sortSpec = new SortSpecBuilder()
                .addAscending("myColumn")
                .build();

        assertEquals(1, sortSpec.sortDefs().length());
        assertEquals("myColumn", sortSpec.sortDefs().apply(0).column());
        assertEquals('A', sortSpec.sortDefs().apply(0).sortType());
    }

    @Test
    void buildWithDescending() {
        SortSpec sortSpec = new SortSpecBuilder()
                .addDescending("myColumn")
                .build();

        assertEquals(1, sortSpec.sortDefs().length());
        assertEquals("myColumn", sortSpec.sortDefs().apply(0).column());
        assertEquals('D', sortSpec.sortDefs().apply(0).sortType());
    }

    @Test
    void buildWithDefaultValues() {
        SortSpec sortSpec = new SortSpecBuilder()
                .build();

        assertEquals(0, sortSpec.sortDefs().length());
    }

}