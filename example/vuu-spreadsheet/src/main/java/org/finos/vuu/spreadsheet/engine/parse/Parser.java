package org.finos.vuu.spreadsheet.engine.parse;

import org.finos.vuu.spreadsheet.engine.CellRef;
import org.finos.vuu.spreadsheet.engine.GridBounds;
import org.finos.vuu.spreadsheet.engine.RangeRef;
import org.finos.vuu.spreadsheet.engine.ast.Expr;
import org.finos.vuu.spreadsheet.engine.ast.Expr.Operator;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Recursive-descent parser for formulas. Precedence, lowest first:
 * comparison, {@code &}, {@code + -}, {@code * /}, {@code ^}, unary {@code + -}, postfix {@code %}.
 * As in Excel, unary minus binds tighter than {@code ^}, so {@code =-2^2} is 4.
 */
public final class Parser {

    private final GridBounds bounds;
    private List<Token> tokens;
    private int index;

    private Parser(GridBounds bounds) {
        this.bounds = bounds;
    }

    /**
     * Parses the text of a formula, including the leading '='.
     *
     * @throws FormulaParseException if the formula is malformed or references a cell outside {@code bounds}
     */
    public static Expr parseFormula(String formula, GridBounds bounds) {
        if (!formula.startsWith("=")) {
            throw new FormulaParseException("Formula must start with '='", 0);
        }
        Parser parser = new Parser(bounds);
        parser.tokens = new Lexer(formula.substring(1), 1).tokenize();
        if (parser.peek().type() == Token.Type.EOF) {
            throw new FormulaParseException("Formula is empty", 1);
        }
        Expr expr = parser.comparison();
        Token trailing = parser.peek();
        if (trailing.type() != Token.Type.EOF) {
            throw parser.unexpected(trailing);
        }
        return expr;
    }

    private Expr comparison() {
        Expr left = concat();
        while (true) {
            Operator op = switch (peek().type()) {
                case EQ -> Operator.EQ;
                case NE -> Operator.NE;
                case LT -> Operator.LT;
                case GT -> Operator.GT;
                case LE -> Operator.LE;
                case GE -> Operator.GE;
                default -> null;
            };
            if (op == null) return left;
            advance();
            left = new Expr.BinaryOp(op, left, concat());
        }
    }

    private Expr concat() {
        Expr left = additive();
        while (peek().type() == Token.Type.AMPERSAND) {
            advance();
            left = new Expr.BinaryOp(Operator.CONCAT, left, additive());
        }
        return left;
    }

    private Expr additive() {
        Expr left = multiplicative();
        while (true) {
            Operator op = switch (peek().type()) {
                case PLUS -> Operator.ADD;
                case MINUS -> Operator.SUBTRACT;
                default -> null;
            };
            if (op == null) return left;
            advance();
            left = new Expr.BinaryOp(op, left, multiplicative());
        }
    }

    private Expr multiplicative() {
        Expr left = power();
        while (true) {
            Operator op = switch (peek().type()) {
                case STAR -> Operator.MULTIPLY;
                case SLASH -> Operator.DIVIDE;
                default -> null;
            };
            if (op == null) return left;
            advance();
            left = new Expr.BinaryOp(op, left, power());
        }
    }

    /** Left-associative, as in Excel: 2^3^2 = 64. */
    private Expr power() {
        Expr left = unary();
        while (peek().type() == Token.Type.CARET) {
            advance();
            left = new Expr.BinaryOp(Operator.POWER, left, unary());
        }
        return left;
    }

    private Expr unary() {
        Token t = peek();
        if (t.type() == Token.Type.MINUS) {
            advance();
            return new Expr.UnaryOp(Operator.NEGATE, unary());
        }
        if (t.type() == Token.Type.PLUS) {
            advance();
            return new Expr.UnaryOp(Operator.PLUS, unary());
        }
        return percent();
    }

    private Expr percent() {
        Expr expr = primary();
        while (peek().type() == Token.Type.PERCENT) {
            advance();
            expr = new Expr.PercentOp(expr);
        }
        return expr;
    }

    private Expr primary() {
        Token t = advance();
        switch (t.type()) {
            case NUMBER:
                return new Expr.NumberLit(parseNumber(t));
            case STRING:
                return new Expr.StringLit(t.text());
            case LPAREN: {
                Expr inner = comparison();
                expect(Token.Type.RPAREN, "')'");
                return inner;
            }
            case IDENT:
                return identifier(t);
            default:
                throw unexpected(t);
        }
    }

    private Expr identifier(Token t) {
        String name = t.text();
        if (peek().type() == Token.Type.LPAREN) {
            advance();
            return new Expr.FunctionCall(name.toUpperCase(Locale.ROOT), arguments());
        }
        Optional<CellRef> ref = CellRef.tryParse(name);
        if (ref.isPresent()) {
            CellRef from = checked(ref.get(), t);
            if (peek().type() == Token.Type.COLON) {
                advance();
                Token toToken = expect(Token.Type.IDENT, "a cell reference");
                CellRef to = CellRef.tryParse(toToken.text())
                        .orElseThrow(() -> new FormulaParseException("Expected a cell reference but found '" + toToken.text() + "'", toToken.position()));
                return new Expr.RangeExpr(new RangeRef(from, checked(to, toToken)));
            }
            return new Expr.CellRefExpr(from);
        }
        String upper = name.toUpperCase(Locale.ROOT);
        if (upper.equals("TRUE")) return new Expr.BoolLit(true);
        if (upper.equals("FALSE")) return new Expr.BoolLit(false);
        return new Expr.NameExpr(name);
    }

    private List<Expr> arguments() {
        List<Expr> args = new ArrayList<>();
        if (peek().type() == Token.Type.RPAREN) {
            advance();
            return args;
        }
        args.add(comparison());
        while (peek().type() == Token.Type.COMMA) {
            advance();
            args.add(comparison());
        }
        expect(Token.Type.RPAREN, "',' or ')'");
        return args;
    }

    private CellRef checked(CellRef ref, Token t) {
        if (!bounds.contains(ref)) {
            throw new FormulaParseException("Cell " + ref + " is outside the sheet", t.position());
        }
        return ref;
    }

    private double parseNumber(Token t) {
        try {
            return Double.parseDouble(t.text());
        } catch (NumberFormatException e) {
            throw new FormulaParseException("Invalid number '" + t.text() + "'", t.position());
        }
    }

    private Token expect(Token.Type type, String description) {
        Token t = advance();
        if (t.type() != type) {
            throw new FormulaParseException("Expected " + description + " but found " + describe(t), t.position());
        }
        return t;
    }

    private FormulaParseException unexpected(Token t) {
        return new FormulaParseException("Unexpected " + describe(t), t.position());
    }

    private static String describe(Token t) {
        return t.type() == Token.Type.EOF ? "end of formula" : "'" + t.text() + "'";
    }

    private Token peek() {
        return tokens.get(index);
    }

    private Token advance() {
        Token t = tokens.get(index);
        if (t.type() != Token.Type.EOF) index++;
        return t;
    }
}
