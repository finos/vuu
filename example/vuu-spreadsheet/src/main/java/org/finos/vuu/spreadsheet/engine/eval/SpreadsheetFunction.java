package org.finos.vuu.spreadsheet.engine.eval;

import org.finos.vuu.spreadsheet.engine.CellValue;
import org.finos.vuu.spreadsheet.engine.ast.Expr;

import java.util.List;

/**
 * A built-in function such as SUM. Arguments arrive unevaluated so functions like IF can be lazy
 * and aggregate functions can tell a range or cell reference apart from a direct value.
 */
@FunctionalInterface
public interface SpreadsheetFunction {
    CellValue apply(List<Expr> args, Evaluator evaluator);
}
