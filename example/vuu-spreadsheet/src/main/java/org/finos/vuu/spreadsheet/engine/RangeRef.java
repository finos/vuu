package org.finos.vuu.spreadsheet.engine;

import java.util.ArrayList;
import java.util.List;

/** A rectangular range such as {@code A1:C3}, normalised so {@code from} is the top-left corner. */
public record RangeRef(CellRef from, CellRef to) {

    public RangeRef {
        CellRef topLeft = new CellRef(Math.min(from.col(), to.col()), Math.min(from.row(), to.row()));
        CellRef bottomRight = new CellRef(Math.max(from.col(), to.col()), Math.max(from.row(), to.row()));
        from = topLeft;
        to = bottomRight;
    }

    /** Every cell in the range in row-major order (A1, B1, A2, B2), the order Excel flattens ranges in. */
    public List<CellRef> cells() {
        List<CellRef> cells = new ArrayList<>();
        for (int row = from.row(); row <= to.row(); row++) {
            for (int col = from.col(); col <= to.col(); col++) {
                cells.add(new CellRef(col, row));
            }
        }
        return cells;
    }

    @Override
    public String toString() {
        return from + ":" + to;
    }
}
