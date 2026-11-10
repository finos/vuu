package org.finos.vuu.spreadsheet.vuu;

import org.finos.vuu.spreadsheet.engine.GridBounds;

import java.time.Duration;

/**
 * Sheet size and RPC timeout. {@link #fromSystemProperties()} reads
 * {@code vuu.spreadsheet.rows}, {@code vuu.spreadsheet.cols} and {@code vuu.spreadsheet.editTimeoutMs}.
 */
public record SpreadsheetConfig(int rows, int cols, Duration editTimeout) {

    public static final int MAX_COLS = 26;

    public SpreadsheetConfig {
        if (cols < 1 || cols > MAX_COLS) throw new IllegalArgumentException("cols must be 1.." + MAX_COLS + ", was " + cols);
        if (rows < 1) throw new IllegalArgumentException("rows must be >= 1, was " + rows);
    }

    public static SpreadsheetConfig defaults() {
        return new SpreadsheetConfig(100, MAX_COLS, Duration.ofSeconds(5));
    }

    public static SpreadsheetConfig fromSystemProperties() {
        SpreadsheetConfig d = defaults();
        return new SpreadsheetConfig(
                Integer.getInteger("vuu.spreadsheet.rows", d.rows()),
                Integer.getInteger("vuu.spreadsheet.cols", d.cols()),
                Duration.ofMillis(Long.getLong("vuu.spreadsheet.editTimeoutMs", d.editTimeout().toMillis())));
    }

    public GridBounds bounds() {
        return new GridBounds(cols, rows);
    }
}
