package org.finos.vuu.spreadsheet.engine;

import java.math.BigDecimal;
import java.math.MathContext;

/** Turns a {@link CellValue} into the string shown in the grid. */
public final class CellFormatter {

    private static final MathContext SIGNIFICANT_DIGITS = new MathContext(10);

    private CellFormatter() {
    }

    public static String format(CellValue value) {
        if (value instanceof CellValue.NumberValue n) return formatNumber(n.value());
        if (value instanceof CellValue.TextValue t) return t.value();
        if (value instanceof CellValue.BoolValue b) return b.value() ? "TRUE" : "FALSE";
        if (value instanceof CellValue.ErrorValue e) return e.code().display();
        return "";
    }

    public static String formatNumber(double d) {
        if (d == 0) return "0";
        double abs = Math.abs(d);
        BigDecimal rounded = new BigDecimal(d).round(SIGNIFICANT_DIGITS);
        if (abs < 1e-9 || abs >= 1e15) {
            // Excel style: 1.5E+15, 1E-10
            int exponent = rounded.precision() - rounded.scale() - 1;
            String mantissa = rounded.movePointLeft(exponent).stripTrailingZeros().toPlainString();
            return mantissa + "E" + (exponent >= 0 ? "+" : "-") + Math.abs(exponent);
        }
        if (d == Math.rint(d)) return Long.toString((long) d);
        return rounded.stripTrailingZeros().toPlainString();
    }
}
