package org.finos.vuu.util;

import org.finos.vuu.core.sort.SortDirection;
import org.finos.vuu.net.SortDef;
import org.finos.vuu.net.SortSpec;

import java.util.ArrayList;
import java.util.List;

import static org.finos.vuu.util.ScalaCollectionConverter.toScalaSeq;

/**
 * Builder for {@link SortSpec}.
 */
public class SortSpecBuilder {

    private final List<SortDef> sortDefs = new ArrayList<>();

    /**
     * Adds one SortDef.
     *
     * @param sortDef to be added
     * @return this builder
     */
    public SortSpecBuilder addSortDef(SortDef sortDef) {
        this.sortDefs.add(sortDef);
        return this;
    }
    
    /**
     * Adds SortDefs.
     *
     * @param sortDefs to be added
     * @return this builder
     */
    public SortSpecBuilder addSortDefs(List<SortDef> sortDefs) {
        this.sortDefs.addAll(sortDefs);
        return this;
    }

    /**
     * Adds one column to be sorted Ascendingly
     *
     * @param columnName to be sorted by
     * @return this builder
     */
    public SortSpecBuilder addAscending(String columnName) {
        sortDefs.add(new SortDef(columnName, SortDirection.ASCENDING().external()));
        return this;
    }

    /**
     * Adds one column to be sorted Descendingly
     *
     * @param columnName to be sorted by
     * @return this builder
     */
    public SortSpecBuilder addDescending(String columnName) {
        sortDefs.add(new SortDef(columnName, SortDirection.DESCENDING().external()));
        return this;
    }

    /**
     * Creates a {@link SortSpec}.
     *
     * @return SortSpec
     */
    public SortSpec build() {
        return new SortSpec(toScalaSeq(sortDefs).toList());
    }
}
