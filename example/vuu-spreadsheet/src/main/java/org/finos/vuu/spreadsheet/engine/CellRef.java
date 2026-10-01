package org.finos.vuu.spreadsheet.engine;

import java.util.Comparator;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * An immutable reference to a single cell, e.g. {@code B3}.
 *
 * @param col zero-based column index (A = 0)
 * @param row one-based row number, as displayed
 */
public record CellRef(int col, int row) implements Comparable<CellRef> {

    private static final Pattern A1 = Pattern.compile("\\$?([A-Za-z]{1,3})\\$?([0-9]{1,7})");

    /** Column first, then row, so "A2" sorts before "B1". */
    private static final Comparator<CellRef> ORDER =
            Comparator.comparingInt(CellRef::col).thenComparingInt(CellRef::row);

    public CellRef {
        if (col < 0) throw new IllegalArgumentException("Column index must be >= 0, was " + col);
        if (row < 1) throw new IllegalArgumentException("Row must be >= 1, was " + row);
    }

    /** Parses {@code A1}, {@code $A$1}, {@code aa10}; absolute markers are accepted and ignored. */
    public static CellRef parse(String text) {
        return tryParse(text).orElseThrow(() -> new IllegalArgumentException("Not a cell reference: " + text));
    }

    public static Optional<CellRef> tryParse(String text) {
        Matcher m = A1.matcher(text);
        if (!m.matches()) return Optional.empty();
        int row = Integer.parseInt(m.group(2));
        if (row < 1) return Optional.empty();
        return Optional.of(new CellRef(columnIndex(m.group(1)), row));
    }

    public static int columnIndex(String letters) {
        int index = 0;
        for (char c : letters.toUpperCase(Locale.ROOT).toCharArray()) {
            index = index * 26 + (c - 'A' + 1);
        }
        return index - 1;
    }

    public static String columnName(int col) {
        StringBuilder sb = new StringBuilder();
        int n = col + 1;
        while (n > 0) {
            int rem = (n - 1) % 26;
            sb.insert(0, (char) ('A' + rem));
            n = (n - 1) / 26;
        }
        return sb.toString();
    }

    public String columnName() {
        return columnName(col);
    }

    @Override
    public int compareTo(CellRef other) {
        return ORDER.compare(this, other);
    }

    @Override
    public String toString() {
        return columnName() + row;
    }
}
