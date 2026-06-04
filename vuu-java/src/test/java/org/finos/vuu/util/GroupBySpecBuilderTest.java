package org.finos.vuu.util;

import org.finos.vuu.net.AggregationSpec;
import org.finos.vuu.net.GroupBySpec;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GroupBySpecBuilderTest {

    @Test
    void buildWithAllParameters() {
        GroupBySpec groupBySpec = new GroupBySpecBuilder()
                .columns(new String[]{"test"})
                .aggregations(List.of(new AggregationSpec("type", "col")))
                .build();

        assertEquals(1, groupBySpec.columns().length);
        assertEquals("test", groupBySpec.columns()[0]);
        assertEquals(1, groupBySpec.aggregations().length());
        assertEquals("type", groupBySpec.aggregations().apply(0).aggregationType());
        assertEquals("col", groupBySpec.aggregations().apply(0).column());
    }

    @Test
    void buildWithDefaultValues() {
        GroupBySpec groupBySpec = new GroupBySpecBuilder()
                .build();

        assertEquals(0, groupBySpec.columns().length);
        assertEquals(0, groupBySpec.aggregations().length());
    }

}