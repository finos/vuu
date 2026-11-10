package org.finos.vuu.spreadsheet.engine;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.finos.vuu.spreadsheet.engine.Formulas.BOUNDS;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertSame;

class CellInputAndFormatterTest {

    @ParameterizedTest(name = "{0} -> {1} {2}")
    @CsvSource(delimiter = '|', quoteCharacter = '`', value = {
            "42        | NUMBER | 42",
            "-3.5      | NUMBER | -3.5",
            "1e3       | NUMBER | 1000",
            "12%       | NUMBER | 0.12",
            "true      | BOOL   | TRUE",
            "'42       | TEXT   | 42",
            "hello     | TEXT   | hello",
            "NaN       | TEXT   | NaN",
            "0x10      | TEXT   | 0x10",
    })
    void classifiesLiterals(String raw, String type, String display) {
        CellInput.Literal literal = assertInstanceOf(CellInput.Literal.class, CellInput.parse(raw, BOUNDS));
        assertEquals(type, literal.value().typeName());
        assertEquals(display, CellFormatter.format(literal.value()));
        assertEquals(raw, literal.raw());
    }

    @Test
    void emptyOrNullClears() {
        assertSame(CellInput.Clear.INSTANCE, CellInput.parse("", BOUNDS));
        assertSame(CellInput.Clear.INSTANCE, CellInput.parse(null, BOUNDS));
    }

    @Test
    void formulasCarryTheirPrecedents() {
        CellInput.Formula f = assertInstanceOf(CellInput.Formula.class, CellInput.parse("=SUM(A1:A2)+B1", BOUNDS));
        assertEquals(3, f.precedents().size());
    }

    @ParameterizedTest(name = "{0} -> {1}")
    @CsvSource(delimiter = '|', quoteCharacter = '`', value = {
            "3.0                  | 3",
            "-7                   | -7",
            "0.1                  | 0.1",
            "0.30000000000000004  | 0.3",
            "3.14159265358979     | 3.141592654",
            "123456789012345      | 123456789012345",
            "1.5E15               | 1.5E+15",
            "1E-10                | 1E-10",
            "-2.5E-12             | -2.5E-12",
    })
    void formatsNumbers(double value, String expected) {
        assertEquals(expected, CellFormatter.formatNumber(value));
    }

    @Test
    void cellRefRoundTrips() {
        assertEquals("A1", new CellRef(0, 1).toString());
        assertEquals("Z9", CellRef.parse("z9").toString());
        assertEquals("AA10", CellRef.parse("AA10").toString());
        assertEquals(26, CellRef.columnIndex("AA"));
    }
}
