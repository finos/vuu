package org.finos.vuu.spreadsheet.vuu;

import org.finos.vuu.core.table.DataTable;
import org.finos.vuu.core.table.RowWithData;
import org.finos.vuu.provider.Provider;
import org.finos.vuu.spreadsheet.engine.CalculationEngine;
import org.finos.vuu.spreadsheet.engine.CellChange;
import org.finos.vuu.spreadsheet.engine.CellFormatter;
import org.finos.vuu.spreadsheet.engine.CellRef;
import org.finos.vuu.spreadsheet.engine.RecalcListener;
import org.finos.vuu.spreadsheet.engine.RecalcResult;

import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;

import static org.finos.vuu.util.ScalaCollectionConverter.toScala;

/**
 * Owns the {@code Sheet} grid table: seeds an empty row per sheet row on start, then writes the
 * display value of every cell whose value changes after a recalculation.
 */
public class SheetProvider implements Provider, RecalcListener {

    private final DataTable table;
    private final CalculationEngine engine;

    public SheetProvider(DataTable table, CalculationEngine engine) {
        this.table = table;
        this.engine = engine;
    }

    public static String rowKey(int row) {
        return Integer.toString(row);
    }

    @Override
    public void doStart() {
        int cols = engine.bounds().cols();
        for (int row = 1; row <= engine.bounds().rows(); row++) {
            Map<String, Object> data = new HashMap<>();
            data.put(SpreadsheetModule.ROW_COLUMN, row);
            for (int col = 0; col < cols; col++) {
                data.put(CellRef.columnName(col), "");
            }
            table.processUpdate(rowKey(row), new RowWithData(rowKey(row), toScala(data)));
        }
        engine.addListener(this);
    }

    /** Called on the engine's calc thread. Sends one partial-row update per affected row. */
    @Override
    public void onRecalcComplete(RecalcResult result) {
        Map<Integer, Map<String, Object>> byRow = new TreeMap<>();
        for (CellChange change : result.changes()) {
            if (!change.valueChanged()) continue;
            byRow.computeIfAbsent(change.ref().row(), r -> new HashMap<>())
                    .put(change.ref().columnName(), CellFormatter.format(change.value()));
        }
        // InMemDataTable merges partial rows into the existing row, so only changed columns are sent.
        byRow.forEach((row, data) -> table.processUpdate(rowKey(row), new RowWithData(rowKey(row), toScala(data))));
    }

    @Override
    public void doStop() {
    }

    @Override
    public void doInitialize() {
    }

    @Override
    public void doDestroy() {
    }

    @Override
    public String lifecycleId() {
        return "SheetProvider";
    }

    @Override
    public void subscribe(String key) {
    }
}
