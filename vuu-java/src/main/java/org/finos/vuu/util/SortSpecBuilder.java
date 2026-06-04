package org.finos.vuu.util;

import org.finos.vuu.net.SortDef;
import org.finos.vuu.net.SortSpec;

import java.util.List;

import static org.finos.vuu.util.ScalaCollectionConverter.toScalaSeq;

public class SortSpecBuilder {
    private List<SortDef> sortDefs = List.of();

    public SortSpecBuilder sortDefs(List<SortDef> sortDefs) {
        this.sortDefs = sortDefs;
        return this;
    }

    public SortSpec build() {
        return new SortSpec(toScalaSeq(sortDefs).toList());
    }
}
