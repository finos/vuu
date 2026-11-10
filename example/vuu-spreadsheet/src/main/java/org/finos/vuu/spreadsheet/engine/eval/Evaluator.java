package org.finos.vuu.spreadsheet.engine.eval;

import org.finos.vuu.spreadsheet.engine.CellValue;
import org.finos.vuu.spreadsheet.engine.CellValue.BoolValue;
import org.finos.vuu.spreadsheet.engine.CellValue.EmptyValue;
import org.finos.vuu.spreadsheet.engine.CellValue.ErrorValue;
import org.finos.vuu.spreadsheet.engine.CellValue.NumberValue;
import org.finos.vuu.spreadsheet.engine.CellValue.TextValue;
import org.finos.vuu.spreadsheet.engine.ErrorCode;
import org.finos.vuu.spreadsheet.engine.ast.Expr;

/** Evaluates an {@link Expr} against the current values of other cells. */
public final class Evaluator {

    private final CellLookup cells;
    private final FunctionRegistry functions;

    public Evaluator(CellLookup cells, FunctionRegistry functions) {
        this.cells = cells;
        this.functions = functions;
    }

    public CellLookup cells() {
        return cells;
    }

    /**
     * Evaluates a whole formula. A formula that is just a reference to an empty cell shows 0, as in Excel.
     */
    public CellValue evaluateFormula(Expr expr) {
        CellValue value = evaluate(expr);
        return value instanceof EmptyValue ? new NumberValue(0) : value;
    }

    public CellValue evaluate(Expr expr) {
        if (expr instanceof Expr.NumberLit n) return CellValue.number(n.value());
        if (expr instanceof Expr.StringLit s) return new TextValue(s.value());
        if (expr instanceof Expr.BoolLit b) return new BoolValue(b.value());
        if (expr instanceof Expr.CellRefExpr c) return cells.valueOf(c.ref());
        // A range is only meaningful as a function argument; functions handle RangeExpr themselves.
        if (expr instanceof Expr.RangeExpr) return CellValue.error(ErrorCode.VALUE);
        if (expr instanceof Expr.NameExpr) return CellValue.error(ErrorCode.NAME);
        if (expr instanceof Expr.UnaryOp u) return unary(u);
        if (expr instanceof Expr.PercentOp p) return percent(p);
        if (expr instanceof Expr.BinaryOp b) return binary(b);
        if (expr instanceof Expr.FunctionCall f) return call(f);
        throw new IllegalStateException("Unknown expression " + expr);
    }

    private CellValue unary(Expr.UnaryOp u) {
        CellValue operand = Coercions.toNumber(evaluate(u.operand()));
        if (operand instanceof ErrorValue) return operand;
        double d = ((NumberValue) operand).value();
        return new NumberValue(u.op() == Expr.Operator.NEGATE ? -d : d);
    }

    private CellValue percent(Expr.PercentOp p) {
        CellValue operand = Coercions.toNumber(evaluate(p.operand()));
        if (operand instanceof ErrorValue) return operand;
        return CellValue.number(((NumberValue) operand).value() / 100);
    }

    private CellValue binary(Expr.BinaryOp b) {
        CellValue left = evaluate(b.left());
        CellValue right = evaluate(b.right());
        if (left instanceof ErrorValue) return left;
        if (right instanceof ErrorValue) return right;
        return switch (b.op()) {
            case ADD, SUBTRACT, MULTIPLY, DIVIDE, POWER -> arithmetic(b.op(), left, right);
            case CONCAT -> concat(left, right);
            case EQ, NE, LT, GT, LE, GE -> compare(b.op(), left, right);
            default -> throw new IllegalStateException("Not a binary operator: " + b.op());
        };
    }

    private static CellValue arithmetic(Expr.Operator op, CellValue leftValue, CellValue rightValue) {
        CellValue l = Coercions.toNumber(leftValue);
        if (l instanceof ErrorValue) return l;
        CellValue r = Coercions.toNumber(rightValue);
        if (r instanceof ErrorValue) return r;
        double x = ((NumberValue) l).value();
        double y = ((NumberValue) r).value();
        return switch (op) {
            case ADD -> CellValue.number(x + y);
            case SUBTRACT -> CellValue.number(x - y);
            case MULTIPLY -> CellValue.number(x * y);
            case DIVIDE -> y == 0 ? CellValue.error(ErrorCode.DIV0) : CellValue.number(x / y);
            case POWER -> (x == 0 && y == 0) ? CellValue.error(ErrorCode.NUM) : CellValue.number(Math.pow(x, y));
            default -> throw new IllegalStateException("Not arithmetic: " + op);
        };
    }

    private static CellValue concat(CellValue left, CellValue right) {
        String l = ((TextValue) Coercions.toText(left)).value();
        String r = ((TextValue) Coercions.toText(right)).value();
        return new TextValue(l + r);
    }

    /** Excel ordering across types: numbers < text < booleans. Text compares case-insensitively. */
    private static CellValue compare(Expr.Operator op, CellValue left, CellValue right) {
        int cmp = compareValues(left, right);
        boolean result = switch (op) {
            case EQ -> cmp == 0;
            case NE -> cmp != 0;
            case LT -> cmp < 0;
            case GT -> cmp > 0;
            case LE -> cmp <= 0;
            case GE -> cmp >= 0;
            default -> throw new IllegalStateException("Not a comparison: " + op);
        };
        return new BoolValue(result);
    }

    static int compareValues(CellValue left, CellValue right) {
        // An empty cell compares as 0, "" or FALSE depending on what it is compared with.
        if (left instanceof EmptyValue) left = emptyLike(right);
        if (right instanceof EmptyValue) right = emptyLike(left);
        int rankL = rank(left);
        int rankR = rank(right);
        if (rankL != rankR) return Integer.compare(rankL, rankR);
        if (left instanceof NumberValue l && right instanceof NumberValue r) return Double.compare(l.value(), r.value());
        if (left instanceof TextValue l && right instanceof TextValue r) return l.value().compareToIgnoreCase(r.value());
        if (left instanceof BoolValue l && right instanceof BoolValue r) return Boolean.compare(l.value(), r.value());
        return 0;
    }

    private static CellValue emptyLike(CellValue other) {
        if (other instanceof TextValue) return new TextValue("");
        if (other instanceof BoolValue) return new BoolValue(false);
        return new NumberValue(0);
    }

    private static int rank(CellValue v) {
        if (v instanceof NumberValue) return 0;
        if (v instanceof TextValue) return 1;
        return 2;
    }

    private CellValue call(Expr.FunctionCall f) {
        return functions.lookup(f.name())
                .map(fn -> fn.apply(f.args(), this))
                .orElse(CellValue.error(ErrorCode.NAME));
    }
}
