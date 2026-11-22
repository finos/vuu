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

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import static org.finos.vuu.util.ScalaCollectionConverter.toScala;

/**
 * Owns the read-only {@code SheetCells} table: one row per non-empty cell showing what was typed,
 * the computed value and the cell's edges in the dependency graph.
 */
public class SheetCellsProvider implements Provider, RecalcListener {

    private final DataTable table;
    private final CalculationEngine engine;

    public SheetCellsProvider(DataTable table, CalculationEngine engine) {
        this.table = table;
        this.engine = engine;
    }

    @Override
    public void doStart() {
        engine.addListener(this);
    }

    /** Called on the engine's calc thread. */
    @Override
    public void onRecalcComplete(RecalcResult result) {
        for (CellChange change : result.changes()) {
            String key = change.ref().toString();
            if (change.input().isEmpty()) {
                table.processDelete(key);
                continue;
            }
            Map<String, Object> data = new HashMap<>();
            data.put("cellRef", key);
            data.put("col", change.ref().col());
            data.put("row", change.ref().row());
            data.put("input", change.input().get());
            data.put("value", CellFormatter.format(change.value()));
            data.put("valueType", change.value().typeName());
            data.put("precedents", join(change.precedents()));
            data.put("dependents", join(change.dependents()));
            data.put("lastCalcSeq", change.lastCalcSeq());
            table.processUpdate(key, new RowWithData(key, toScala(data)));
        }
    }

    private static String join(Collection<CellRef> refs) {
        return refs.stream().map(CellRef::toString).collect(Collectors.joining(","));
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
        return "SheetCellsProvider";
    }

    @Override
    public void subscribe(String key) {
    }
}
