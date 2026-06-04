package org.finos.vuu.util;

import org.finos.vuu.net.SortDef;
import org.finos.vuu.net.SortSpec;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SortSpecBuilderTest {

    @Test
    void buildWithAllParameters() {
        SortSpec sortSpec = new SortSpecBuilder()
                .sortDefs(List.of(new SortDef("myColumn", 'D')))
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