package org.finos.vuu.spreadsheet.engine;

/** The size of the sheet. Formulas may only reference cells inside it. */
public record GridBounds(int cols, int rows) {

    public GridBounds {
        if (cols < 1 || rows < 1) throw new IllegalArgumentException("Grid must be at least 1x1");
    }

    public boolean contains(CellRef ref) {
        return ref.col() < cols && ref.row() <= rows;
    }

    public void check(CellRef ref) {
        if (!contains(ref)) {
            throw new IllegalArgumentException("Cell " + ref + " is outside the sheet (A1:" + new CellRef(cols - 1, rows) + ")");
        }
    }
}
