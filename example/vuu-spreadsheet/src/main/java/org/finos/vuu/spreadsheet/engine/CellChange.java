package org.finos.vuu.spreadsheet.engine;

import java.util.Optional;
import java.util.SortedSet;

/**
 * The state of one cell after a recalculation.
 *
 * @param input        what the user typed, or empty if the cell holds nothing
 * @param previousValue the value before the edit; equal to {@code value} unless {@code valueChanged}
 * @param valueChanged whether {@code value} differs from before the edit. False for cells reported only
 *                     because their input or dependency edges changed.
 * @param lastCalcSeq  the edit sequence number of the recalc that last changed this cell
 */
public record CellChange(CellRef ref,
                         Optional<String> input,
                         CellValue value,
                         CellValue previousValue,
                         boolean valueChanged,
                         SortedSet<CellRef> precedents,
                         SortedSet<CellRef> dependents,
                         long lastCalcSeq) {
}
