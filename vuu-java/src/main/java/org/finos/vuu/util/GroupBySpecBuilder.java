package org.finos.vuu.util;

import org.finos.vuu.net.AggregationSpec;
import org.finos.vuu.net.GroupBySpec;

import java.util.List;

import static org.finos.vuu.util.ScalaCollectionConverter.toScalaSeq;

public class GroupBySpecBuilder {
    private String[] columns = new String[0];
    private List<AggregationSpec> aggregations = List.of();

    public GroupBySpecBuilder columns(String[] columns) {
        this.columns = columns;
        return this;
    }

    public GroupBySpecBuilder aggregations(List<AggregationSpec> aggregations) {
        this.aggregations = aggregations;
        return this;
    }

    public GroupBySpec build() {
        return new GroupBySpec(columns, toScalaSeq(aggregations).toList());
    }
}
