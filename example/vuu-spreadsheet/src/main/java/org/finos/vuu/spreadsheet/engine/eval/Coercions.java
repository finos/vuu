package org.finos.vuu.spreadsheet.engine.eval;

import org.finos.vuu.spreadsheet.engine.CellFormatter;
import org.finos.vuu.spreadsheet.engine.CellValue;
import org.finos.vuu.spreadsheet.engine.CellValue.BoolValue;
import org.finos.vuu.spreadsheet.engine.CellValue.EmptyValue;
import org.finos.vuu.spreadsheet.engine.CellValue.ErrorValue;
import org.finos.vuu.spreadsheet.engine.CellValue.NumberValue;
import org.finos.vuu.spreadsheet.engine.CellValue.TextValue;
import org.finos.vuu.spreadsheet.engine.ErrorCode;

import java.util.Locale;
import java.util.OptionalDouble;

/** Excel-style conversions between value types. Each returns either the converted value or an {@link ErrorValue}. */
public final class Coercions {

    private Coercions() {
    }

    /** Empty is 0, booleans are 1/0, numeric text is parsed, other text is #VALUE!. */
    public static CellValue toNumber(CellValue value) {
        if (value instanceof NumberValue || value instanceof ErrorValue) return value;
        if (value instanceof EmptyValue) return new NumberValue(0);
        if (value instanceof BoolValue b) return new NumberValue(b.value() ? 1 : 0);
        if (value instanceof TextValue t) {
            OptionalDouble parsed = parseNumber(t.value());
            return parsed.isPresent() ? new NumberValue(parsed.getAsDouble()) : CellValue.error(ErrorCode.VALUE);
        }
        throw new IllegalStateException("Unknown value " + value);
    }

    public static CellValue toText(CellValue value) {
        if (value instanceof TextValue || value instanceof ErrorValue) return value;
        return new TextValue(CellFormatter.format(value));
    }

    public static CellValue toBool(CellValue value) {
        if (value instanceof BoolValue || value instanceof ErrorValue) return value;
        if (value instanceof EmptyValue) return new BoolValue(false);
        if (value instanceof NumberValue n) return new BoolValue(n.value() != 0);
        if (value instanceof TextValue t) {
            String upper = t.value().trim().toUpperCase(Locale.ROOT);
            if (upper.equals("TRUE")) return new BoolValue(true);
            if (upper.equals("FALSE")) return new BoolValue(false);
            return CellValue.error(ErrorCode.VALUE);
        }
        throw new IllegalStateException("Unknown value " + value);
    }

    /** Parses plain numbers and percentages ({@code 12%} is 0.12). Leading/trailing whitespace is ignored. */
    public static OptionalDouble parseNumber(String text) {
        String s = text.trim();
        if (s.isEmpty()) return OptionalDouble.empty();
        double scale = 1;
        if (s.endsWith("%")) {
            s = s.substring(0, s.length() - 1).trim();
            scale = 0.01;
        }
        // Double.parseDouble also accepts "NaN", "Infinity", hex and a trailing 'd'/'f'; spreadsheets don't.
        if (!s.matches("[+-]?(\\d+\\.?\\d*|\\.\\d+)([eE][+-]?\\d+)?")) return OptionalDouble.empty();
        return OptionalDouble.of(Double.parseDouble(s) * scale);
    }
}
