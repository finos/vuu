package org.finos.vuu.spreadsheet.engine;

import org.finos.vuu.spreadsheet.engine.graph.CycleDetectedException;
import org.finos.vuu.spreadsheet.engine.graph.DependencyGraph;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DependencyGraphTest {

    private final DependencyGraph graph = new DependencyGraph();

    private static CellRef c(String ref) {
        return CellRef.parse(ref);
    }

    private static Set<CellRef> cells(String... refs) {
        return Arrays.stream(refs).map(CellRef::parse).collect(Collectors.toSet());
    }

    private static String order(List<CellRef> refs) {
        return refs.stream().map(CellRef::toString).collect(Collectors.joining(","));
    }

    @Test
    void selfReferenceIsACycle() {
        CycleDetectedException e = assertThrows(CycleDetectedException.class, () -> graph.setPrecedents(c("A1"), cells("A1")));
        assertEquals("Circular reference: A1 -> A1", e.getMessage());
    }

    @Test
    void twoCellCycleIsRejectedAndGraphIsUnchanged() {
        graph.setPrecedents(c("B2"), cells("A1", "C1"));
        CycleDetectedException e = assertThrows(CycleDetectedException.class, () -> graph.setPrecedents(c("A1"), cells("B2")));
        assertEquals("Circular reference: A1 -> B2 -> A1", e.getMessage());
        assertEquals(Set.of(), graph.precedentsOf(c("A1")));
        assertEquals(cells("B2"), graph.dependentsOf(c("A1")));
    }

    @Test
    void longCycleThroughARange() {
        graph.setPrecedents(c("B1"), cells("A1", "A2", "A3")); // B1 = SUM(A1:A3)
        graph.setPrecedents(c("C1"), cells("B1"));
        graph.setPrecedents(c("D1"), cells("C1"));
        CycleDetectedException e = assertThrows(CycleDetectedException.class, () -> graph.setPrecedents(c("A2"), cells("D1")));
        assertEquals("Circular reference: A2 -> D1 -> C1 -> B1 -> A2", e.getMessage());
    }

    @Test
    void batchCanCreateACycleBetweenTwoNewEdges() {
        assertThrows(CycleDetectedException.class,
                () -> graph.setPrecedents(Map.of(c("A1"), cells("B1"), c("B1"), cells("A1"))));
        assertEquals(Set.of(), graph.precedentsOf(c("A1")));
        assertEquals(Set.of(), graph.precedentsOf(c("B1")));
    }

    @Test
    void replacingPrecedentsCanRemoveAPotentialCycle() {
        graph.setPrecedents(c("B1"), cells("A1"));
        // B1 no longer reads A1, so A1 may now read B1
        graph.setPrecedents(Map.of(c("B1"), Set.of(), c("A1"), cells("B1")));
        assertEquals(Set.of(), graph.dependentsOf(c("A1")));
        assertEquals(cells("A1"), graph.dependentsOf(c("B1")));
    }

    @Test
    void diamondEvaluatesSinkOnceAfterBothBranches() {
        graph.setPrecedents(c("B1"), cells("A1"));
        graph.setPrecedents(c("C1"), cells("A1"));
        graph.setPrecedents(c("D1"), cells("B1", "C1"));
        assertEquals("A1,B1,C1,D1", order(graph.recalcOrder(List.of(c("A1")))));
    }

    @Test
    void orderIsTopologicalNotAlphabetical() {
        // A3 <- B1 <- A1 : A1 must come last even though it sorts first
        graph.setPrecedents(c("B1"), cells("A3"));
        graph.setPrecedents(c("A1"), cells("B1"));
        assertEquals("A3,B1,A1", order(graph.recalcOrder(List.of(c("A3")))));
    }

    @Test
    void onlyDownstreamCellsAreRecalculated() {
        graph.setPrecedents(c("B1"), cells("A1"));
        graph.setPrecedents(c("B2"), cells("A2"));
        assertEquals("A2,B2", order(graph.recalcOrder(List.of(c("A2")))));
    }

    @Test
    void longChainDoesNotOverflowTheStack() {
        DependencyGraph big = new DependencyGraph();
        int n = 50_000;
        for (int row = 2; row <= n; row++) {
            big.setPrecedents(new CellRef(0, row), Set.of(new CellRef(0, row - 1)));
        }
        assertThrows(CycleDetectedException.class, () -> big.setPrecedents(new CellRef(0, 1), Set.of(new CellRef(0, n))));
        assertEquals(n, big.recalcOrder(List.of(new CellRef(0, 1))).size());
    }
}
