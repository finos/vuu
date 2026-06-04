package org.finos.vuu.util;

import org.finos.vuu.net.AggregationSpec;
import org.finos.vuu.net.GroupBySpec;

import java.util.List;

import static org.finos.vuu.util.ScalaCollectionConverter.toScalaSeq;

/**
 * Builder for {@link GroupBySpec}.
 */
public class GroupBySpecBuilder {
    private String[] columns = new String[0];
    private List<AggregationSpec> aggregations = List.of();

    /**
     * Sets columns.
     *
     * @param columns columns
     * @return this builder
     */
    public GroupBySpecBuilder columns(String[] columns) {
        this.columns = columns;
        return this;
    }


    /**
     * Sets aggregations.
     *
     * @param aggregations aggregation specifications
     * @return this builder
     */
    public GroupBySpecBuilder aggregations(List<AggregationSpec> aggregations) {
        this.aggregations = aggregations;
        return this;
    }

    /**
     * Creates a {@link GroupBySpec}.
     *
     * @return GroupBySpec
     */
    public GroupBySpec build() {
        return new GroupBySpec(columns, toScalaSeq(aggregations).toList());
    }
}