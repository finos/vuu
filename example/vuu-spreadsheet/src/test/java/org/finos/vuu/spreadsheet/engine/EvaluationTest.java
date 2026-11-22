package org.finos.vuu.spreadsheet.engine;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.Map;

import static org.finos.vuu.spreadsheet.engine.Formulas.display;
import static org.junit.jupiter.api.Assertions.assertEquals;

class EvaluationTest {

    private static final Map<String, String> CELLS = Map.of(
            "A1", "1",
            "A2", "2",
            "A3", "3",
            "B1", "hello",
            "B2", "TRUE",
            "C1", "'42"          // text that looks like a number
    );

    @ParameterizedTest(name = "{0} = {1}")
    @CsvSource(delimiter = '|', quoteCharacter = '`', value = {
            // coercion in arithmetic
            "=A1+A2        | 3",
            "=Z99+1        | 1",        // empty is 0
            "=\"3\"+1      | 4",        // numeric text is coerced
            "=C1*2         | 84",
            "=B1+1         | #VALUE!",
            "=B2+1         | 2",        // TRUE is 1
            // errors
            "=1/0          | #DIV/0!",
            "=1/Z99        | #DIV/0!",
            "=(1/0)+B1     | #DIV/0!",  // first error wins
            "=B1+(1/0)     | #DIV/0!",  // an operand error beats a failed coercion
            "=0^0          | #NUM!",
            "=10^400       | #NUM!",
            "=A1:A3+1      | #VALUE!",  // bare range outside a function
            // concatenation
            "=A1&B1        | 1hello",
            "=B1&Z99       | hello",
            "=B2&\"\"      | TRUE",
            "=0.1+0.2&\"\" | 0.3",
            // comparison
            "=B1=\"HELLO\" | TRUE",     // case-insensitive
            "=A1<B1        | TRUE",     // numbers < text
            "=B1<B2        | TRUE",     // text < booleans
            "=Z99=0        | TRUE",     // empty compares as 0 ...
            "=Z99=\"\"     | TRUE",     // ... or as ""
            // a formula that is just an empty reference shows 0
            "=Z99          | 0",
    })
    void evaluates(String formula, String expected) {
        assertEquals(expected, display(formula, CELLS));
    }

    @Test
    void theUsersExamples() {
        assertEquals("3", display("=1+2"));
        Map<String, String> cells = Map.of("A1", "1", "B1", "10", "C1", "2");
        assertEquals("3", display("=SUM(A1+C1)", cells));
        assertEquals("3", display("=SUM(A1,C1)", cells));
        assertEquals("13", display("=SUM(A1:C1)", cells));
    }
}
