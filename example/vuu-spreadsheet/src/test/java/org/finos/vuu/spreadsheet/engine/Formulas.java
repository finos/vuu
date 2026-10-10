package org.finos.vuu.spreadsheet.engine;

import org.finos.vuu.spreadsheet.engine.eval.Evaluator;
import org.finos.vuu.spreadsheet.engine.eval.FunctionRegistry;
import org.finos.vuu.spreadsheet.engine.parse.Parser;

import java.util.HashMap;
import java.util.Map;

/** Evaluates a single formula against fixed cell values, without an engine. */
final class Formulas {

    static final GridBounds BOUNDS = new GridBounds(26, 100);
    private static final FunctionRegistry FUNCTIONS = FunctionRegistry.withBuiltIns();

    private Formulas() {
    }

    static CellValue eval(String formula) {
        return eval(formula, Map.of());
    }

    /** @param cells cell values keyed by "A1"-style reference; raw inputs as the user would type them */
    static CellValue eval(String formula, Map<String, String> cells) {
        Map<CellRef, CellValue> values = new HashMap<>();
        cells.forEach((ref, raw) -> {
            CellInput input = CellInput.parse(raw, BOUNDS);
            values.put(CellRef.parse(ref), ((CellInput.Literal) input).value());
        });
        Evaluator evaluator = new Evaluator(ref -> values.getOrDefault(ref, CellValue.EMPTY), FUNCTIONS);
        return evaluator.evaluateFormula(Parser.parseFormula(formula, BOUNDS));
    }

    static String display(String formula) {
        return CellFormatter.format(eval(formula));
    }

    static String display(String formula, Map<String, String> cells) {
        return CellFormatter.format(eval(formula, cells));
    }
}
