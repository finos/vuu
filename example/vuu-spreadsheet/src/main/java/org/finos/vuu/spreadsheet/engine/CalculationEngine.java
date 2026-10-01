package org.finos.vuu.spreadsheet.engine;

import org.finos.vuu.spreadsheet.engine.eval.Evaluator;
import org.finos.vuu.spreadsheet.engine.eval.FunctionRegistry;
import org.finos.vuu.spreadsheet.engine.graph.CycleDetectedException;
import org.finos.vuu.spreadsheet.engine.graph.DependencyGraph;
import org.finos.vuu.spreadsheet.engine.parse.FormulaParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * A spreadsheet calculation engine.
 * <p>
 * All mutable state (cell inputs and values, the {@link DependencyGraph}, the edit sequence) is owned
 * by a single calc thread, so edits apply in a strict order without locks. An edit goes through two
 * phases on that thread:
 * <ol>
 *   <li><b>Structural</b>: check for cycles, update the graph, store the input. The future returned by
 *   {@link #submitEdit} completes here, so a caller learns straight away whether the edit was accepted.</li>
 *   <li><b>Recalculation</b>: evaluate the edited cells and all their transitive dependents in topological
 *   order, then tell each {@link RecalcListener} what changed.</li>
 * </ol>
 */
public final class CalculationEngine implements AutoCloseable {

    private static final Logger logger = LoggerFactory.getLogger(CalculationEngine.class);

    private record CellState(CellInput input, CellValue value, long lastCalcSeq) {
    }

    private final GridBounds bounds;
    private final FunctionRegistry functions;
    private final ExecutorService calcThread;
    private final List<RecalcListener> listeners = new CopyOnWriteArrayList<>();

    // Owned by the calc thread.
    private final Map<CellRef, CellState> cells = new HashMap<>();
    private final DependencyGraph graph = new DependencyGraph();
    private long editSeq;

    /** Replaced by the calc thread after each recalculation; safe to read from any thread. */
    private volatile Map<CellRef, CellState> snapshot = Map.of();

    public CalculationEngine(GridBounds bounds, FunctionRegistry functions) {
        this.bounds = bounds;
        this.functions = functions;
        this.calcThread = Executors.newSingleThreadExecutor(runnable -> {
            Thread thread = new Thread(runnable, "vuu-spreadsheet-calc");
            thread.setDaemon(true);
            return thread;
        });
    }

    public GridBounds bounds() {
        return bounds;
    }

    public void addListener(RecalcListener listener) {
        listeners.add(listener);
    }

    /**
     * Sets one cell's input. The returned future fails with {@link FormulaParseException},
     * {@link CycleDetectedException} or {@link IllegalArgumentException} (cell outside the sheet) if the
     * edit is rejected, in which case nothing changes.
     */
    public CompletableFuture<EditAccepted> submitEdit(CellRef cell, String rawInput) {
        Map<CellRef, String> edit = new HashMap<>();
        edit.put(cell, rawInput); // Map.of rejects null, which means "clear"
        return submitEdits(edit);
    }

    /** Applies several edits atomically: either all are accepted, with one recalculation, or none. */
    public CompletableFuture<EditAccepted> submitEdits(Map<CellRef, String> rawInputs) {
        Map<CellRef, CellInput> parsed = new TreeMap<>();
        try {
            // Parsing needs no engine state, so it happens on the caller's thread.
            rawInputs.forEach((cell, raw) -> {
                bounds.check(cell);
                parsed.put(cell, CellInput.parse(raw, bounds));
            });
        } catch (RuntimeException e) {
            return CompletableFuture.failedFuture(e);
        }
        CompletableFuture<EditAccepted> result = new CompletableFuture<>();
        try {
            calcThread.execute(() -> apply(parsed, result));
        } catch (RejectedExecutionException e) {
            result.completeExceptionally(new IllegalStateException("Calculation engine is closed", e));
        }
        return result;
    }

    /** The value last calculated for {@code cell}. */
    public CellValue valueOf(CellRef cell) {
        CellState state = snapshot.get(cell);
        return state == null ? CellValue.EMPTY : state.value();
    }

    /** What the user typed into {@code cell}, if anything. */
    public Optional<String> inputOf(CellRef cell) {
        return Optional.ofNullable(snapshot.get(cell)).map(s -> s.input().raw());
    }

    /** Blocks until every edit submitted so far has been recalculated and published. Mainly for tests. */
    public void awaitQuiescence(Duration timeout) throws InterruptedException, TimeoutException {
        try {
            calcThread.submit(() -> { }).get(timeout.toMillis(), TimeUnit.MILLISECONDS);
        } catch (ExecutionException e) {
            throw new IllegalStateException(e.getCause());
        }
    }

    @Override
    public void close() {
        calcThread.shutdown();
    }

    // ---- calc thread -----------------------------------------------------------------------------

    private void apply(Map<CellRef, CellInput> requested, CompletableFuture<EditAccepted> result) {
        try {
            Map<CellRef, CellInput> edits = new TreeMap<>();
            requested.forEach((cell, input) -> {
                if (!sameInput(cells.get(cell), input)) edits.put(cell, input);
            });
            if (edits.isEmpty()) {
                RecalcResult nothing = new RecalcResult(editSeq, List.of());
                result.complete(new EditAccepted(editSeq, false, CompletableFuture.completedFuture(nothing)));
                return;
            }

            Map<CellRef, Set<CellRef>> newPrecedents = new HashMap<>();
            Set<CellRef> edgesChanged = new TreeSet<>();
            edits.forEach((cell, input) -> {
                newPrecedents.put(cell, input.precedents());
                edgesChanged.addAll(graph.precedentsOf(cell));
                edgesChanged.addAll(input.precedents());
            });
            graph.setPrecedents(newPrecedents); // throws CycleDetectedException without side effects

            long seq = ++editSeq;
            Map<CellRef, CellValue> previousValues = new HashMap<>();
            edits.forEach((cell, input) -> {
                CellState old = cells.get(cell);
                previousValues.put(cell, old == null ? CellValue.EMPTY : old.value());
                if (input instanceof CellInput.Clear) {
                    cells.remove(cell);
                } else {
                    cells.put(cell, new CellState(input, previousValues.get(cell), old == null ? 0 : old.lastCalcSeq()));
                }
            });
            CompletableFuture<RecalcResult> recalculated = new CompletableFuture<>();
            result.complete(new EditAccepted(seq, true, recalculated));

            try {
                recalculated.complete(recalculate(seq, edits.keySet(), previousValues, edgesChanged));
            } catch (RuntimeException e) {
                logger.error("Recalculation of edit {} failed", seq, e);
                recalculated.completeExceptionally(e);
            }
        } catch (RuntimeException e) {
            // Rejected in the structural phase (e.g. a cycle); nothing has changed.
            result.completeExceptionally(e);
        }
    }

    private RecalcResult recalculate(long seq, Set<CellRef> edited, Map<CellRef, CellValue> previousValues, Set<CellRef> edgesChanged) {
        Evaluator evaluator = new Evaluator(this::currentValue, functions);
        Map<CellRef, CellValue> toReport = new TreeMap<>(); // cell -> value before this edit

        for (CellRef cell : graph.recalcOrder(edited)) {
            CellState state = cells.get(cell);
            CellValue before = previousValues.containsKey(cell) ? previousValues.get(cell) : currentValue(cell);
            CellValue after = state == null ? CellValue.EMPTY : compute(state.input(), evaluator, cell);
            boolean valueChanged = !after.equals(before);
            if (state != null) {
                long lastCalcSeq = valueChanged || edited.contains(cell) ? seq : state.lastCalcSeq();
                cells.put(cell, new CellState(state.input(), after, lastCalcSeq));
            }
            if (valueChanged || edited.contains(cell)) toReport.put(cell, before);
        }
        for (CellRef cell : edgesChanged) {
            toReport.putIfAbsent(cell, currentValue(cell)); // value unchanged
        }

        snapshot = Map.copyOf(cells);

        List<CellChange> changes = new ArrayList<>(toReport.size());
        toReport.forEach((cell, before) -> changes.add(describe(cell, before)));
        RecalcResult result = new RecalcResult(seq, changes);
        for (RecalcListener listener : listeners) {
            try {
                listener.onRecalcComplete(result);
            } catch (RuntimeException e) {
                logger.error("RecalcListener {} failed for edit {}", listener, seq, e);
            }
        }
        return result;
    }

    private CellValue compute(CellInput input, Evaluator evaluator, CellRef cell) {
        if (input instanceof CellInput.Literal literal) return literal.value();
        if (input instanceof CellInput.Formula formula) {
            try {
                return evaluator.evaluateFormula(formula.expr());
            } catch (RuntimeException e) {
                logger.error("Unexpected error evaluating {} in {}", formula.raw(), cell, e);
                return CellValue.error(ErrorCode.VALUE);
            }
        }
        return CellValue.EMPTY;
    }

    private CellValue currentValue(CellRef cell) {
        CellState state = cells.get(cell);
        return state == null ? CellValue.EMPTY : state.value();
    }

    private CellChange describe(CellRef cell, CellValue before) {
        CellState state = cells.get(cell);
        CellValue value = state == null ? CellValue.EMPTY : state.value();
        return new CellChange(
                cell,
                state == null ? Optional.empty() : Optional.of(state.input().raw()),
                value,
                before,
                !value.equals(before),
                new TreeSet<>(graph.precedentsOf(cell)),
                new TreeSet<>(graph.dependentsOf(cell)),
                state == null ? 0 : state.lastCalcSeq());
    }

    private static boolean sameInput(CellState current, CellInput input) {
        String currentRaw = current == null ? null : current.input().raw();
        return Objects.equals(currentRaw, input.raw());
    }
}
