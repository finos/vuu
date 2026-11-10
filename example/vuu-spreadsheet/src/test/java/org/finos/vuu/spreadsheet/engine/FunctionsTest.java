package org.finos.vuu.spreadsheet.engine;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.Map;

import static org.finos.vuu.spreadsheet.engine.Formulas.display;
import static org.junit.jupiter.api.Assertions.assertEquals;

class FunctionsTest {

    // A1:A4 = 1, 2, text, TRUE. Errors come from formulas such as 1/0.
    private static final Map<String, String> CELLS = Map.of(
            "A1", "1",
            "A2", "2",
            "A3", "text",
            "A4", "TRUE",
            "C1", "5",
            "C2", "-2.5"
    );

    @ParameterizedTest(name = "{0} = {1}")
    @CsvSource(delimiter = '|', quoteCharacter = '`', value = {
            // SUM: references skip text/bools/empties, direct args are coerced
            "=SUM(A1:A5)            | 3",
            "=SUM(A3)               | 0",
            "=SUM(1,\"2\",TRUE)     | 4",
            "=SUM(\"x\")            | #VALUE!",
            "=SUM(1/0,1)            | #DIV/0!",
            "=SUM()                 | 0",
            // AVERAGE / MIN / MAX / COUNT
            "=AVERAGE(A1:A4)        | 1.5",
            "=AVERAGE(A3:A4)        | #DIV/0!",
            "=MIN(A1:A4,C2)         | -2.5",
            "=MAX(A1:A4,C1)         | 5",
            "=MAX(A3:A4)            | 0",
            "=COUNT(A1:A5)          | 2",
            "=COUNT(1,\"2\",\"x\")  | 2",
            "=COUNT(1/0,1)          | 1",
            // IF is lazy
            "=IF(TRUE,1,1/0)        | 1",
            "=IF(FALSE,1/0,2)       | 2",
            "=IF(A1>1,\"big\",\"small\") | small",
            "=IF(FALSE,1)           | FALSE",
            "=IF(1/0,1,2)           | #DIV/0!",
            "=IF(\"x\",1,2)         | #VALUE!",
            "=IF(TRUE)              | #VALUE!",
            // AND / OR / NOT
            "=AND(TRUE,1)           | TRUE",
            "=AND(A1:A4)            | TRUE",
            "=AND(TRUE,0)           | FALSE",
            "=OR(FALSE,0)           | FALSE",
            "=OR(A3)                | #VALUE!",
            "=NOT(A1)               | FALSE",
            "=NOT(1,2)              | #VALUE!",
            // ABS / ROUND
            "=ABS(C2)               | 2.5",
            "=ROUND(2.5,0)          | 3",
            "=ROUND(-2.5,0)         | -3",
            "=ROUND(3.14159,2)      | 3.14",
            "=ROUND(1234,-2)        | 1200",
            "=ROUND(1.005,2)        | 1.01",
            // CONCAT flattens ranges row-major
            "=CONCAT(A1:A3,\"!\")   | 12text!",
            "=CONCAT(A1:C1)         | 15",
            "=CONCAT(1/0)           | #DIV/0!",
    })
    void evaluates(String formula, String expected) {
        assertEquals(expected, display(formula, CELLS));
    }
}
