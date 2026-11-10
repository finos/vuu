package org.finos.vuu.spreadsheet.engine.eval;

import org.finos.vuu.spreadsheet.engine.CellRef;
import org.finos.vuu.spreadsheet.engine.CellValue;

/** Where the evaluator reads other cells' current values from. Empty cells return {@link CellValue#EMPTY}. */
@FunctionalInterface
public interface CellLookup {
    CellValue valueOf(CellRef ref);
}
