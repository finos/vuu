package org.finos.vuu.util;

import org.finos.vuu.net.SortDef;
import org.finos.vuu.net.SortSpec;

import java.util.List;

import static org.finos.vuu.util.ScalaCollectionConverter.toScalaSeq;

/**
 * Builder for {@link SortSpec}.
 */
public class SortSpecBuilder {
    private List<SortDef> sortDefs = List.of();

    /**
     * Sets SortDefs.
     *
     * @param sortDefs sortDefs
     * @return this builder
     */
    public SortSpecBuilder sortDefs(List<SortDef> sortDefs) {
        this.sortDefs = sortDefs;
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
