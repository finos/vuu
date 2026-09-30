package org.finos.vuu.spreadsheet.engine;

import org.finos.vuu.spreadsheet.engine.ast.Expr;
import org.finos.vuu.spreadsheet.engine.eval.Coercions;
import org.finos.vuu.spreadsheet.engine.parse.FormulaParseException;
import org.finos.vuu.spreadsheet.engine.parse.Parser;

import java.util.Locale;
import java.util.OptionalDouble;
import java.util.Set;
import java.util.TreeSet;

/** What the user typed into a cell, classified and (for formulas) parsed. */
public sealed interface CellInput {

    /**
     * Classifies raw input:
     * <ul>
     *   <li>null or "" clears the cell</li>
     *   <li>"=..." is a formula</li>
     *   <li>"'..." is text, with the quote removed (Excel's "force text" prefix)</li>
     *   <li>numbers ("42", "-3.5", "1e3", "12%") and TRUE/FALSE become typed values</li>
     *   <li>anything else is text</li>
     * </ul>
     *
     * @throws FormulaParseException if a formula is malformed
     */
    static CellInput parse(String raw, GridBounds bounds) {
        if (raw == null || raw.isEmpty()) return Clear.INSTANCE;
        if (raw.startsWith("=")) {
            Expr expr = Parser.parseFormula(raw, bounds);
            Set<CellRef> precedents = new TreeSet<>();
            expr.collectRefs(precedents);
            return new Formula(raw, expr, Set.copyOf(precedents));
        }
        if (raw.startsWith("'")) return new Literal(raw, new CellValue.TextValue(raw.substring(1)));
        OptionalDouble number = Coercions.parseNumber(raw);
        if (number.isPresent()) return new Literal(raw, CellValue.number(number.getAsDouble()));
        String upper = raw.trim().toUpperCase(Locale.ROOT);
        if (upper.equals("TRUE")) return new Literal(raw, new CellValue.BoolValue(true));
        if (upper.equals("FALSE")) return new Literal(raw, new CellValue.BoolValue(false));
        return new Literal(raw, new CellValue.TextValue(raw));
    }

    /** Exactly what the user typed; null for {@link Clear}. */
    String raw();

    /** Cells this input reads. Empty for anything but a formula. */
    default Set<CellRef> precedents() {
        return Set.of();
    }

    record Literal(String raw, CellValue value) implements CellInput {
    }

    record Formula(String raw, Expr expr, Set<CellRef> precedents) implements CellInput {
    }

    final class Clear implements CellInput {
        public static final Clear INSTANCE = new Clear();

        private Clear() {
        }

        @Override
        public String raw() {
            return null;
        }

        @Override
        public String toString() {
            return "Clear";
        }
    }
}
