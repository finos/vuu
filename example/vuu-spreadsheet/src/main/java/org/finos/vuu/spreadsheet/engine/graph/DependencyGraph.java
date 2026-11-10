package org.finos.vuu.spreadsheet.engine.graph;

import org.finos.vuu.spreadsheet.engine.CellRef;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Set;

/**
 * The cell dependency DAG. An edge {@code X -> P} means formula X reads cell P; X is a
 * <em>dependent</em> of P, and P is a <em>precedent</em> of X.
 * <p>
 * Edits that would introduce a cycle are rejected without changing the graph, so the graph is
 * always acyclic and {@link #recalcOrder} never has to deal with cycles.
 * <p>
 * Not thread-safe: the engine only touches it from its calc thread.
 */
public final class DependencyGraph {

    private final Map<CellRef, Set<CellRef>> precedents = new HashMap<>();
    private final Map<CellRef, Set<CellRef>> dependents = new HashMap<>();

    public Set<CellRef> precedentsOf(CellRef cell) {
        return Collections.unmodifiableSet(precedents.getOrDefault(cell, Set.of()));
    }

    public Set<CellRef> dependentsOf(CellRef cell) {
        return Collections.unmodifiableSet(dependents.getOrDefault(cell, Set.of()));
    }

    public void setPrecedents(CellRef cell, Set<CellRef> newPrecedents) {
        setPrecedents(Map.of(cell, newPrecedents));
    }

    /**
     * Replaces the precedents of several cells at once.
     *
     * @throws CycleDetectedException if the new edges would create a cycle; the graph is left unchanged
     */
    public void setPrecedents(Map<CellRef, Set<CellRef>> changes) {
        // The current graph is acyclic, so any new cycle must pass through a changed cell.
        for (CellRef cell : changes.keySet()) {
            checkNoPathBackTo(cell, changes);
        }
        changes.forEach(this::replaceEdges);
    }

    /**
     * Every changed cell plus all of its transitive dependents, ordered so each cell comes after
     * all of its precedents. Ties are broken by {@link CellRef} order so results are deterministic.
     */
    public List<CellRef> recalcOrder(Collection<CellRef> changed) {
        Set<CellRef> dirty = new HashSet<>(changed);
        Deque<CellRef> queue = new ArrayDeque<>(changed);
        while (!queue.isEmpty()) {
            for (CellRef dependent : dependents.getOrDefault(queue.poll(), Set.of())) {
                if (dirty.add(dependent)) queue.add(dependent);
            }
        }

        // Kahn's algorithm, restricted to the dirty cells.
        Map<CellRef, Integer> inDegree = new HashMap<>();
        for (CellRef cell : dirty) {
            int n = 0;
            for (CellRef p : precedents.getOrDefault(cell, Set.of())) {
                if (dirty.contains(p)) n++;
            }
            inDegree.put(cell, n);
        }
        PriorityQueue<CellRef> ready = new PriorityQueue<>();
        inDegree.forEach((cell, n) -> {
            if (n == 0) ready.add(cell);
        });
        List<CellRef> order = new ArrayList<>(dirty.size());
        while (!ready.isEmpty()) {
            CellRef cell = ready.poll();
            order.add(cell);
            for (CellRef dependent : dependents.getOrDefault(cell, Set.of())) {
                if (inDegree.merge(dependent, -1, Integer::sum) == 0) ready.add(dependent);
            }
        }
        if (order.size() != dirty.size()) {
            throw new IllegalStateException("Dependency graph contains a cycle; this should have been rejected on edit");
        }
        return order;
    }

    /**
     * {@code cell} reading P closes a cycle exactly when P already depends on {@code cell}, i.e. P is
     * downstream of it. So walk dependent edges (as they would be after the change) from {@code cell}
     * looking for any of its new precedents. Walking downstream rather than upstream keeps the common
     * case cheap: a formula added at the end of a long chain has no dependents, so the walk stops at once.
     * Iterative, so long chains can't overflow the stack.
     */
    private void checkNoPathBackTo(CellRef cell, Map<CellRef, Set<CellRef>> changes) {
        Set<CellRef> targets = changes.get(cell);
        if (targets.contains(cell)) {
            throw new CycleDetectedException(List.of(cell, cell));
        }
        if (targets.isEmpty()) return;

        Map<CellRef, Set<CellRef>> proposedDependents = new HashMap<>();
        changes.forEach((changed, ps) -> ps.forEach(p -> proposedDependents.computeIfAbsent(p, k -> new HashSet<>()).add(changed)));

        Map<CellRef, CellRef> reachedFrom = new HashMap<>();
        Deque<CellRef> stack = new ArrayDeque<>();
        reachedFrom.put(cell, null);
        stack.push(cell);
        while (!stack.isEmpty()) {
            CellRef current = stack.pop();
            for (CellRef d : dependentsAfterChange(current, changes, proposedDependents)) {
                if (reachedFrom.containsKey(d)) continue;
                reachedFrom.put(d, current);
                if (targets.contains(d)) {
                    throw new CycleDetectedException(path(cell, d, reachedFrom));
                }
                stack.push(d);
            }
        }
    }

    private Set<CellRef> dependentsAfterChange(CellRef cell, Map<CellRef, Set<CellRef>> changes,
                                               Map<CellRef, Set<CellRef>> proposedDependents) {
        Set<CellRef> result = new HashSet<>();
        for (CellRef d : dependents.getOrDefault(cell, Set.of())) {
            if (!changes.containsKey(d)) result.add(d); // changed cells' edges come from proposedDependents
        }
        result.addAll(proposedDependents.getOrDefault(cell, Set.of()));
        return result;
    }

    /**
     * The cycle in the "reads" direction: {@code cell} reads {@code precedent}, which (via the
     * downstream walk, reversed) reads its way back to {@code cell}.
     */
    private static List<CellRef> path(CellRef cell, CellRef precedent, Map<CellRef, CellRef> reachedFrom) {
        List<CellRef> path = new ArrayList<>();
        path.add(cell);
        for (CellRef c = precedent; !c.equals(cell); c = reachedFrom.get(c)) {
            path.add(c);
        }
        path.add(cell);
        return path;
    }

    private void replaceEdges(CellRef cell, Set<CellRef> newPrecedents) {
        Set<CellRef> old = precedents.remove(cell);
        if (old != null) {
            for (CellRef p : old) {
                Set<CellRef> ds = dependents.get(p);
                ds.remove(cell);
                if (ds.isEmpty()) dependents.remove(p);
            }
        }
        if (!newPrecedents.isEmpty()) {
            precedents.put(cell, new HashSet<>(newPrecedents));
            for (CellRef p : newPrecedents) {
                dependents.computeIfAbsent(p, k -> new HashSet<>()).add(cell);
            }
        }
    }
}
