package org.finos.vuu.spreadsheet.engine.ast;

import org.finos.vuu.spreadsheet.engine.CellRef;
import org.finos.vuu.spreadsheet.engine.RangeRef;

import java.util.List;
import java.util.Set;

/** A parsed formula expression. */
public sealed interface Expr {

    /** Adds every cell this expression reads, with ranges expanded, to {@code refs}. */
    void collectRefs(Set<CellRef> refs);

    record NumberLit(double value) implements Expr {
        @Override public void collectRefs(Set<CellRef> refs) { }
    }

    record StringLit(String value) implements Expr {
        @Override public void collectRefs(Set<CellRef> refs) { }
    }

    record BoolLit(boolean value) implements Expr {
        @Override public void collectRefs(Set<CellRef> refs) { }
    }

    record CellRefExpr(CellRef ref) implements Expr {
        @Override public void collectRefs(Set<CellRef> refs) { refs.add(ref); }
    }

    record RangeExpr(RangeRef range) implements Expr {
        @Override public void collectRefs(Set<CellRef> refs) { refs.addAll(range.cells()); }
    }

    /** A bare identifier that is not a cell, boolean or function call. Evaluates to #NAME?. */
    record NameExpr(String name) implements Expr {
        @Override public void collectRefs(Set<CellRef> refs) { }
    }

    record UnaryOp(Operator op, Expr operand) implements Expr {
        @Override public void collectRefs(Set<CellRef> refs) { operand.collectRefs(refs); }
    }

    record PercentOp(Expr operand) implements Expr {
        @Override public void collectRefs(Set<CellRef> refs) { operand.collectRefs(refs); }
    }

    record BinaryOp(Operator op, Expr left, Expr right) implements Expr {
        @Override public void collectRefs(Set<CellRef> refs) {
            left.collectRefs(refs);
            right.collectRefs(refs);
        }
    }

    record FunctionCall(String name, List<Expr> args) implements Expr {
        public FunctionCall {
            args = List.copyOf(args);
        }

        @Override public void collectRefs(Set<CellRef> refs) {
            args.forEach(arg -> arg.collectRefs(refs));
        }
    }

    enum Operator {
        ADD, SUBTRACT, MULTIPLY, DIVIDE, POWER, CONCAT,
        EQ, NE, LT, GT, LE, GE,
        NEGATE, PLUS
    }
}
