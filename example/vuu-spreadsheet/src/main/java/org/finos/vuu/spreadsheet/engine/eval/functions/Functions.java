package org.finos.vuu.spreadsheet.engine.eval.functions;

import org.finos.vuu.spreadsheet.engine.CellRef;
import org.finos.vuu.spreadsheet.engine.CellValue;
import org.finos.vuu.spreadsheet.engine.CellValue.BoolValue;
import org.finos.vuu.spreadsheet.engine.CellValue.ErrorValue;
import org.finos.vuu.spreadsheet.engine.CellValue.NumberValue;
import org.finos.vuu.spreadsheet.engine.CellValue.TextValue;
import org.finos.vuu.spreadsheet.engine.ErrorCode;
import org.finos.vuu.spreadsheet.engine.ast.Expr;
import org.finos.vuu.spreadsheet.engine.eval.Coercions;
import org.finos.vuu.spreadsheet.engine.eval.Evaluator;
import org.finos.vuu.spreadsheet.engine.eval.FunctionRegistry;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * The built-in functions.
 * <p>
 * Excel treats arguments differently depending on how they are written. A reference ({@code A1} or
 * {@code A1:B3}) contributes only the values of the kinds a function cares about and skips the rest.
 * A direct value ({@code "3"}, {@code TRUE}, {@code A1+1}) is coerced, and fails with #VALUE! if it can't be.
 * So {@code =SUM(A1)} ignores text in A1, but {@code =SUM("x")} is #VALUE!.
 */
public final class Functions {

    private Functions() {
    }

    public static void registerAll(FunctionRegistry registry) {
        registry.register("SUM", Functions::sum)
                .register("AVERAGE", Functions::average)
                .register("MIN", Functions::min)
                .register("MAX", Functions::max)
                .register("COUNT", Functions::count)
                .register("IF", Functions::ifFunction)
                .register("AND", Functions::and)
                .register("OR", Functions::or)
                .register("NOT", Functions::not)
                .register("ABS", Functions::abs)
                .register("ROUND", Functions::round)
                .register("CONCAT", Functions::concat);
    }

    // ---- aggregates ------------------------------------------------------------------------------

    /** The numbers from {@code args}, or the first error encountered. */
    private record Numbers(List<Double> values, ErrorValue error) {
    }

    private static Numbers numbers(List<Expr> args, Evaluator evaluator) {
        List<Double> values = new ArrayList<>();
        for (Expr arg : args) {
            if (isReference(arg)) {
                for (CellValue v : referencedValues(arg, evaluator)) {
                    if (v instanceof ErrorValue e) return new Numbers(values, e);
                    if (v instanceof NumberValue n) values.add(n.value());
                }
            } else {
                CellValue v = Coercions.toNumber(evaluator.evaluate(arg));
                if (v instanceof ErrorValue e) return new Numbers(values, e);
                values.add(((NumberValue) v).value());
            }
        }
        return new Numbers(values, null);
    }

    private static CellValue sum(List<Expr> args, Evaluator evaluator) {
        Numbers n = numbers(args, evaluator);
        if (n.error() != null) return n.error();
        return CellValue.number(n.values().stream().mapToDouble(Double::doubleValue).sum());
    }

    private static CellValue average(List<Expr> args, Evaluator evaluator) {
        Numbers n = numbers(args, evaluator);
        if (n.error() != null) return n.error();
        if (n.values().isEmpty()) return CellValue.error(ErrorCode.DIV0);
        return CellValue.number(n.values().stream().mapToDouble(Double::doubleValue).average().orElseThrow());
    }

    private static CellValue min(List<Expr> args, Evaluator evaluator) {
        Numbers n = numbers(args, evaluator);
        if (n.error() != null) return n.error();
        return CellValue.number(n.values().stream().mapToDouble(Double::doubleValue).min().orElse(0));
    }

    private static CellValue max(List<Expr> args, Evaluator evaluator) {
        Numbers n = numbers(args, evaluator);
        if (n.error() != null) return n.error();
        return CellValue.number(n.values().stream().mapToDouble(Double::doubleValue).max().orElse(0));
    }

    /** Counts numbers. Unlike the other aggregates, errors are skipped rather than propagated. */
    private static CellValue count(List<Expr> args, Evaluator evaluator) {
        int count = 0;
        for (Expr arg : args) {
            if (isReference(arg)) {
                for (CellValue v : referencedValues(arg, evaluator)) {
                    if (v instanceof NumberValue) count++;
                }
            } else if (Coercions.toNumber(evaluator.evaluate(arg)) instanceof NumberValue) {
                count++;
            }
        }
        return new NumberValue(count);
    }

    // ---- logic -----------------------------------------------------------------------------------

    /** Only the chosen branch is evaluated, so {@code =IF(TRUE, 1, 1/0)} is 1. */
    private static CellValue ifFunction(List<Expr> args, Evaluator evaluator) {
        if (args.size() < 2 || args.size() > 3) return CellValue.error(ErrorCode.VALUE);
        CellValue condition = Coercions.toBool(evaluator.evaluate(args.get(0)));
        if (condition instanceof ErrorValue) return condition;
        if (((BoolValue) condition).value()) return evaluator.evaluate(args.get(1));
        return args.size() == 3 ? evaluator.evaluate(args.get(2)) : new BoolValue(false);
    }

    private static CellValue and(List<Expr> args, Evaluator evaluator) {
        return logical(args, evaluator, true);
    }

    private static CellValue or(List<Expr> args, Evaluator evaluator) {
        return logical(args, evaluator, false);
    }

    private static CellValue logical(List<Expr> args, Evaluator evaluator, boolean isAnd) {
        List<Boolean> values = new ArrayList<>();
        for (Expr arg : args) {
            if (isReference(arg)) {
                for (CellValue v : referencedValues(arg, evaluator)) {
                    if (v instanceof ErrorValue) return v;
                    if (v instanceof BoolValue || v instanceof NumberValue) {
                        values.add(((BoolValue) Coercions.toBool(v)).value());
                    }
                }
            } else {
                CellValue v = Coercions.toBool(evaluator.evaluate(arg));
                if (v instanceof ErrorValue) return v;
                values.add(((BoolValue) v).value());
            }
        }
        if (values.isEmpty()) return CellValue.error(ErrorCode.VALUE);
        boolean result = isAnd
                ? values.stream().allMatch(Boolean::booleanValue)
                : values.stream().anyMatch(Boolean::booleanValue);
        return new BoolValue(result);
    }

    private static CellValue not(List<Expr> args, Evaluator evaluator) {
        if (args.size() != 1) return CellValue.error(ErrorCode.VALUE);
        CellValue v = Coercions.toBool(evaluator.evaluate(args.get(0)));
        if (v instanceof ErrorValue) return v;
        return new BoolValue(!((BoolValue) v).value());
    }

    // ---- maths -----------------------------------------------------------------------------------

    private static CellValue abs(List<Expr> args, Evaluator evaluator) {
        if (args.size() != 1) return CellValue.error(ErrorCode.VALUE);
        CellValue v = Coercions.toNumber(evaluator.evaluate(args.get(0)));
        if (v instanceof ErrorValue) return v;
        return new NumberValue(Math.abs(((NumberValue) v).value()));
    }

    /** Rounds half away from zero, as Excel does: ROUND(2.5, 0) = 3, ROUND(-2.5, 0) = -3. */
    private static CellValue round(List<Expr> args, Evaluator evaluator) {
        if (args.size() != 2) return CellValue.error(ErrorCode.VALUE);
        CellValue v = Coercions.toNumber(evaluator.evaluate(args.get(0)));
        if (v instanceof ErrorValue) return v;
        CellValue digits = Coercions.toNumber(evaluator.evaluate(args.get(1)));
        if (digits instanceof ErrorValue) return digits;
        int scale = (int) ((NumberValue) digits).value(); // Excel truncates the digits argument
        BigDecimal rounded = BigDecimal.valueOf(((NumberValue) v).value()).setScale(scale, RoundingMode.HALF_UP);
        return CellValue.number(rounded.doubleValue());
    }

    // ---- text ------------------------------------------------------------------------------------

    private static CellValue concat(List<Expr> args, Evaluator evaluator) {
        StringBuilder sb = new StringBuilder();
        for (Expr arg : args) {
            List<CellValue> values = arg instanceof Expr.RangeExpr
                    ? referencedValues(arg, evaluator)
                    : List.of(evaluator.evaluate(arg));
            for (CellValue v : values) {
                CellValue text = Coercions.toText(v);
                if (text instanceof ErrorValue) return text;
                sb.append(((TextValue) text).value());
            }
        }
        return new TextValue(sb.toString());
    }

    // ---- helpers ---------------------------------------------------------------------------------

    private static boolean isReference(Expr arg) {
        return arg instanceof Expr.RangeExpr || arg instanceof Expr.CellRefExpr;
    }

    /** Values of the cells a reference argument points at, in row-major order. */
    private static List<CellValue> referencedValues(Expr arg, Evaluator evaluator) {
        List<CellRef> refs = arg instanceof Expr.RangeExpr r
                ? r.range().cells()
                : List.of(((Expr.CellRefExpr) arg).ref());
        List<CellValue> values = new ArrayList<>(refs.size());
        for (CellRef ref : refs) values.add(evaluator.cells().valueOf(ref));
        return values;
    }
}
