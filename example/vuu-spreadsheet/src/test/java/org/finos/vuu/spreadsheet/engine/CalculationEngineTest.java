package org.finos.vuu.spreadsheet.engine;

import org.finos.vuu.spreadsheet.engine.eval.Evaluator;
import org.finos.vuu.spreadsheet.engine.eval.FunctionRegistry;
import org.finos.vuu.spreadsheet.engine.graph.CycleDetectedException;
import org.finos.vuu.spreadsheet.engine.parse.FormulaParseException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CalculationEngineTest {

    private final CalculationEngine engine = new CalculationEngine(new GridBounds(26, 100), FunctionRegistry.withBuiltIns());
    private final List<RecalcResult> results = new ArrayList<>();

    CalculationEngineTest() {
        engine.addListener(results::add);
    }

    @AfterEach
    void close() {
        engine.close();
    }

    private EditAccepted edit(String cell, String input) throws Exception {
        EditAccepted accepted = engine.submitEdit(CellRef.parse(cell), input).get(5, TimeUnit.SECONDS);
        engine.awaitQuiescence(Duration.ofSeconds(5));
        return accepted;
    }

    private Throwable rejected(String cell, String input) {
        CompletableFuture<EditAccepted> f = engine.submitEdit(CellRef.parse(cell), input);
        return assertThrows(ExecutionException.class, () -> f.get(5, TimeUnit.SECONDS)).getCause();
    }

    private String value(String cell) {
        return CellFormatter.format(engine.valueOf(CellRef.parse(cell)));
    }

    private RecalcResult last() {
        return results.get(results.size() - 1);
    }

    private static String changedValues(RecalcResult result) {
        return result.changes().stream()
                .filter(CellChange::valueChanged)
                .map(c -> c.ref() + "=" + CellFormatter.format(c.value()))
                .collect(Collectors.joining(","));
    }

    @Test
    void theUsersScenario() throws Exception {
        edit("A1", "1");
        edit("C1", "2");
        edit("B2", "=SUM(A1+C1)");
        assertEquals("3", value("B2"));
        assertEquals("B2=3", changedValues(last()));

        edit("A1", "10");
        assertEquals("12", value("B2"));
        assertEquals("A1=10,B2=12", changedValues(last()));

        Throwable cycle = rejected("A1", "=B2");
        assertInstanceOf(CycleDetectedException.class, cycle);
        assertEquals("Circular reference: A1 -> B2 -> A1", cycle.getMessage());
        assertEquals("10", value("A1"));
        assertEquals("10", engine.inputOf(CellRef.parse("A1")).orElseThrow());
    }

    @Test
    void recalcResultDescribesEdgesForTheDependencyView() throws Exception {
        edit("A1", "1");
        edit("B2", "=A1+C1");
        Map<String, CellChange> byRef = last().changes().stream()
                .collect(Collectors.toMap(c -> c.ref().toString(), c -> c));
        // B2 changed value; A1 and C1 are reported because they gained a dependent
        assertEquals(List.of("A1", "B2", "C1"), byRef.keySet().stream().sorted().toList());
        assertEquals("[B2]", byRef.get("A1").dependents().toString());
        assertFalse(byRef.get("A1").valueChanged());
        assertTrue(byRef.get("C1").input().isEmpty());
        assertEquals("[A1, C1]", byRef.get("B2").precedents().toString());
        assertEquals("=A1+C1", byRef.get("B2").input().orElseThrow());
        assertEquals(last().seq(), byRef.get("B2").lastCalcSeq());
    }

    @Test
    void parseErrorsAreRejectedWithoutChangingTheCell() throws Exception {
        edit("A3", "=1/0");
        assertEquals("#DIV/0!", value("A3"));
        int published = results.size();

        Throwable error = rejected("A3", "=SUM(");
        assertInstanceOf(FormulaParseException.class, error);
        engine.awaitQuiescence(Duration.ofSeconds(5));
        assertEquals("#DIV/0!", value("A3"));
        assertEquals(published, results.size());
    }

    @Test
    void cellsOutsideTheSheetAreRejected() {
        assertInstanceOf(IllegalArgumentException.class, rejected("AA1", "1"));
    }

    @Test
    void errorsPropagateDownstream() throws Exception {
        edit("A1", "=1/0");
        edit("A2", "=A1*2");
        edit("A3", "=IF(TRUE,5,A2)");
        assertEquals("#DIV/0!", value("A2"));
        assertEquals("5", value("A3"));
        edit("A1", "4");
        assertEquals("8", value("A2"));
    }

    @Test
    void clearingAReferencedCellRecalculatesItsDependents() throws Exception {
        edit("A1", "5");
        edit("B1", "=A1+1");
        edit("A1", null);
        assertEquals("1", value("B1"));
        assertEquals("", value("A1"));
        CellChange a1 = last().changes().get(0);
        assertEquals("A1", a1.ref().toString());
        assertTrue(a1.input().isEmpty());
        assertEquals("[B1]", a1.dependents().toString());
    }

    @Test
    void typingIntoAPreviouslyEmptyReferencedCellUpdatesTheFormula() throws Exception {
        edit("B1", "=SUM(A1:A3)");
        assertEquals("0", value("B1"));
        edit("A2", "7");
        assertEquals("7", value("B1"));
    }

    @Test
    void unchangedValueStopsReportingButDependentsAreStillCorrect() throws Exception {
        edit("A1", "=1+1");
        edit("B1", "=A1*10");
        edit("A1", "2"); // same value, different input
        assertEquals("", changedValues(last()));
        assertEquals(List.of("A1"), last().changes().stream().map(c -> c.ref().toString()).toList());
        assertEquals("20", value("B1"));
    }

    @Test
    void retypingIdenticalInputPublishesNothing() throws Exception {
        edit("A1", "=1+1");
        int published = results.size();
        EditAccepted accepted = edit("A1", "=1+1");
        assertFalse(accepted.changed());
        assertEquals(published, results.size());
        assertEquals(List.of(), accepted.recalculated().get(5, TimeUnit.SECONDS).changes());
    }

    @Test
    void eachEditCompletesWithItsOwnRecalcResultIncludingPreviousValues() throws Exception {
        edit("A1", "1");
        edit("B1", "=A1*2");
        EditAccepted accepted = edit("A1", "5");
        RecalcResult result = accepted.recalculated().get(5, TimeUnit.SECONDS);
        assertEquals(accepted.seq(), result.seq());
        assertEquals(last(), result);
        String effect = result.changes().stream()
                .map(c -> c.ref() + ":" + CellFormatter.format(c.previousValue()) + "->" + CellFormatter.format(c.value()))
                .collect(Collectors.joining(","));
        assertEquals("A1:1->5,B1:2->10", effect);
    }

    @Test
    void batchEditIsAtomicWithOneRecalc() throws Exception {
        edit("C1", "=A1+B1");
        int published = results.size();
        Map<CellRef, String> batch = new HashMap<>();
        batch.put(CellRef.parse("A1"), "1");
        batch.put(CellRef.parse("B1"), "2");
        engine.submitEdits(batch).get(5, TimeUnit.SECONDS);
        engine.awaitQuiescence(Duration.ofSeconds(5));
        assertEquals(published + 1, results.size());
        assertEquals("A1=1,B1=2,C1=3", changedValues(last()));

        Map<CellRef, String> bad = new HashMap<>();
        bad.put(CellRef.parse("A1"), "100");
        bad.put(CellRef.parse("B1"), "=C1");
        assertThrows(ExecutionException.class, () -> engine.submitEdits(bad).get(5, TimeUnit.SECONDS));
        assertEquals("1", value("A1"));
    }

    @Test
    void diamondIsEvaluatedAfterBothBranches() throws Exception {
        edit("B1", "=A1+1");
        edit("C1", "=A1*2");
        edit("D1", "=B1&\"/\"&C1");
        edit("A1", "3");
        assertEquals("4/6", value("D1"));
        assertEquals("A1=3,B1=4,C1=6,D1=4/6", changedValues(last()));
    }

    /**
     * Random edits on a small grid, checked after each one against a naive oracle that recomputes
     * every cell from scratch. Also replays every published {@link RecalcResult} into a copy of the
     * grid, the way {@code SheetProvider} does, to prove that publishing only changed cells is enough.
     */
    @ParameterizedTest(name = "seed {0}")
    @ValueSource(longs = {1, 2, 3, 42, 1234})
    void matchesANaiveOracle(long seed) throws Exception {
        GridBounds bounds = new GridBounds(4, 4);
        try (CalculationEngine small = new CalculationEngine(bounds, FunctionRegistry.withBuiltIns())) {
            Map<CellRef, String> published = new HashMap<>();
            small.addListener(result -> result.changes().stream()
                    .filter(CellChange::valueChanged)
                    .forEach(c -> published.put(c.ref(), CellFormatter.format(c.value()))));

            Random random = new Random(seed);
            Map<CellRef, String> accepted = new HashMap<>();
            int rejectedCycles = 0;

            for (int i = 0; i < 400; i++) {
                CellRef cell = randomCell(random, bounds);
                String input = randomInput(random, bounds);
                try {
                    small.submitEdit(cell, input).get(5, TimeUnit.SECONDS);
                    if (input == null) accepted.remove(cell);
                    else accepted.put(cell, input);
                } catch (ExecutionException e) {
                    assertInstanceOf(CycleDetectedException.class, e.getCause());
                    rejectedCycles++;
                }
                small.awaitQuiescence(Duration.ofSeconds(5));

                Map<CellRef, CellValue> expected = oracle(accepted, bounds);
                for (CellRef ref : allCells(bounds)) {
                    String want = CellFormatter.format(expected.getOrDefault(ref, CellValue.EMPTY));
                    assertEquals(want, CellFormatter.format(small.valueOf(ref)), "engine value of " + ref + " after edit " + i);
                    assertEquals(want, published.getOrDefault(ref, ""), "published value of " + ref + " after edit " + i);
                }
            }
            assertTrue(rejectedCycles > 0, "the random edits should exercise cycle rejection");
        }
    }

    private static Map<CellRef, CellValue> oracle(Map<CellRef, String> inputs, GridBounds bounds) {
        Map<CellRef, CellValue> memo = new HashMap<>();
        Evaluator[] evaluator = new Evaluator[1];
        evaluator[0] = new Evaluator(new org.finos.vuu.spreadsheet.engine.eval.CellLookup() {
            @Override
            public CellValue valueOf(CellRef ref) {
                if (memo.containsKey(ref)) return memo.get(ref);
                String raw = inputs.get(ref);
                CellValue v;
                if (raw == null) {
                    v = CellValue.EMPTY;
                } else {
                    CellInput input = CellInput.parse(raw, bounds);
                    v = input instanceof CellInput.Formula f
                            ? evaluator[0].evaluateFormula(f.expr())
                            : ((CellInput.Literal) input).value();
                }
                memo.put(ref, v);
                return v;
            }
        }, FunctionRegistry.withBuiltIns());
        for (CellRef ref : allCells(bounds)) evaluator[0].cells().valueOf(ref);
        return memo;
    }

    private static List<CellRef> allCells(GridBounds bounds) {
        List<CellRef> cells = new ArrayList<>();
        for (int col = 0; col < bounds.cols(); col++) {
            for (int row = 1; row <= bounds.rows(); row++) cells.add(new CellRef(col, row));
        }
        return cells;
    }

    private static CellRef randomCell(Random random, GridBounds bounds) {
        return new CellRef(random.nextInt(bounds.cols()), 1 + random.nextInt(bounds.rows()));
    }

    private static String randomInput(Random random, GridBounds bounds) {
        String a = randomCell(random, bounds).toString();
        String b = randomCell(random, bounds).toString();
        return switch (random.nextInt(8)) {
            case 0 -> null;
            case 1 -> Integer.toString(random.nextInt(20) - 5);
            case 2 -> "=" + a + "+" + b;
            case 3 -> "=" + a + "*2-" + b;
            case 4 -> "=SUM(" + a + ":" + b + ")";
            case 5 -> "=IF(" + a + ">3," + b + ",1)";
            case 6 -> "=" + a + "/" + b;
            default -> "=MAX(" + a + "," + b + ",0)&\"\"";
        };
    }
}
