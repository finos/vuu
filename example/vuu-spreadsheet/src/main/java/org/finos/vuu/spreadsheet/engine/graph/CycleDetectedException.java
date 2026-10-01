package org.finos.vuu.spreadsheet.engine.graph;

import org.finos.vuu.spreadsheet.engine.CellRef;

import java.util.List;
import java.util.stream.Collectors;

/** An edit was rejected because it would make a cell depend on itself. */
public class CycleDetectedException extends RuntimeException {

    private final List<CellRef> cycle;

    /** @param cycle the cells in the cycle, first and last equal, each reading the next */
    public CycleDetectedException(List<CellRef> cycle) {
        super("Circular reference: " + cycle.stream().map(CellRef::toString).collect(Collectors.joining(" -> ")));
        this.cycle = List.copyOf(cycle);
    }

    public List<CellRef> cycle() {
        return cycle;
    }
}
