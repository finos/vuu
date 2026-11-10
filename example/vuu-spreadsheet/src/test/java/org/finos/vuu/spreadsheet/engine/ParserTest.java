package org.finos.vuu.spreadsheet.engine;

import org.finos.vuu.spreadsheet.engine.ast.Expr;
import org.finos.vuu.spreadsheet.engine.parse.FormulaParseException;
import org.finos.vuu.spreadsheet.engine.parse.Parser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.Set;
import java.util.TreeSet;

import static org.finos.vuu.spreadsheet.engine.Formulas.BOUNDS;
import static org.finos.vuu.spreadsheet.engine.Formulas.display;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ParserTest {

    @ParameterizedTest(name = "{0} = {1}")
    @CsvSource(delimiter = '|', quoteCharacter = '`', value = {
            "=1+2           | 3",
            "=1+2*3         | 7",
            "=(1+2)*3       | 9",
            "=10-4-3        | 3",
            "=12/4/3        | 1",
            "=-2^2          | 4",
            "=2^3^2         | 64",
            "=2^-1          | 0.5",
            "=10%           | 0.1",
            "=50%*4         | 2",
            "=-(1+2)        | -3",
            "=+5            | 5",
            "=1+2&3         | 33",
            "=\"a\"&\"b\"   | ab",
            "=1<2           | TRUE",
            "=1+1=2         | TRUE",
            "=2<>2          | FALSE",
            "=3>=3          | TRUE",
            "=.5+1          | 1.5",
            "=1e3           | 1000",
            "=  1 +   2     | 3",
            "=true          | TRUE",
            "=\"say \"\"hi\"\"\" | say \"hi\"",
    })
    void precedenceAndLiterals(String formula, String expected) {
        assertEquals(expected, display(formula));
    }

    @Test
    void cellReferencesAreCaseInsensitiveAndAcceptAbsoluteMarkers() {
        assertEquals(new Expr.CellRefExpr(CellRef.parse("B3")), Parser.parseFormula("=b3", BOUNDS));
        assertEquals(new Expr.CellRefExpr(CellRef.parse("B3")), Parser.parseFormula("=$B$3", BOUNDS));
    }

    @Test
    void functionNamesAreUpperCased() {
        Expr expr = Parser.parseFormula("=sum(a1:a3)", BOUNDS);
        Expr.FunctionCall call = assertInstanceOf(Expr.FunctionCall.class, expr);
        assertEquals("SUM", call.name());
        assertEquals(new Expr.RangeExpr(new RangeRef(CellRef.parse("A1"), CellRef.parse("A3"))), call.args().get(0));
    }

    @Test
    void rangesAreNormalised() {
        Expr expr = Parser.parseFormula("=SUM(C3:A1)", BOUNDS);
        Expr.RangeExpr range = (Expr.RangeExpr) ((Expr.FunctionCall) expr).args().get(0);
        assertEquals("A1:C3", range.range().toString());
    }

    @Test
    void collectsPrecedentsWithRangesExpanded() {
        Set<CellRef> refs = new TreeSet<>();
        Parser.parseFormula("=SUM(A1:B2)+C5*A1", BOUNDS).collectRefs(refs);
        assertEquals("[A1, A2, B1, B2, C5]", refs.toString());
    }

    @Test
    void unknownNamesParseAndEvaluateToNameError() {
        assertEquals("#NAME?", display("=FOO(1)"));
        assertEquals("#NAME?", display("=foo"));
    }

    @ParameterizedTest(name = "{0}")
    @CsvSource(delimiter = '|', quoteCharacter = '`', value = {
            "=SUM(       | Unexpected end of formula at position 5",
            "=1+         | Unexpected end of formula at position 3",
            "=(1+2       | Expected ')' but found end of formula at position 5",
            "=1+2)       | Unexpected ')' at position 4",
            "=SUM(1 2)   | Expected ',' or ')' but found '2' at position 7",
            "=\"abc      | Unterminated string at position 1",
            "=1 # 2      | Unexpected character '#' at position 3",
            "=           | Formula is empty at position 1",
            "=A1:        | Expected a cell reference but found end of formula at position 4",
            "=A1:foo     | Expected a cell reference but found 'foo' at position 4",
            "=AA1        | Cell AA1 is outside the sheet at position 1",
            "=A101       | Cell A101 is outside the sheet at position 1",
    })
    void malformedFormulasReportWhereTheProblemIs(String formula, String message) {
        FormulaParseException e = assertThrows(FormulaParseException.class, () -> Parser.parseFormula(formula, BOUNDS));
        assertEquals(message, e.getMessage());
    }
}
