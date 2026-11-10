package org.finos.vuu.spreadsheet.vuu;

import org.finos.toolbox.time.Clock;
import org.finos.vuu.api.ColumnBuilder;
import org.finos.vuu.api.TableDefBuilder;
import org.finos.vuu.api.ViewPortDef;
import org.finos.vuu.core.module.DefaultModule;
import org.finos.vuu.core.module.ModuleFactory;
import org.finos.vuu.core.module.TableDefContainer;
import org.finos.vuu.core.module.ViewServerModule;
import org.finos.vuu.net.SortSpecBuilder;
import org.finos.vuu.spreadsheet.engine.CalculationEngine;
import org.finos.vuu.spreadsheet.engine.CellRef;
import org.finos.vuu.spreadsheet.engine.eval.FunctionRegistry;

/**
 * A spreadsheet backed by Vuu tables.
 * <ul>
 *   <li>{@code Sheet}: the editable grid. One row per sheet row, one String column per sheet column
 *   holding the cell's display value. Edits go through {@link SpreadsheetEditRpcHandler}.</li>
 *   <li>{@code SheetCells}: read-only, one row per non-empty cell, showing its input, value and
 *   dependency edges.</li>
 * </ul>
 */
public class SpreadsheetModule extends DefaultModule {

    public static final String NAME = "SPREADSHEET";
    public static final String SHEET_TABLE = "Sheet";
    public static final String SHEET_CELLS_TABLE = "SheetCells";
    public static final String ROW_COLUMN = "row";

    private CalculationEngine engine;

    public ViewServerModule create(TableDefContainer tableDefContainer, Clock clock) {
        return create(tableDefContainer, clock, SpreadsheetConfig.fromSystemProperties());
    }

    public ViewServerModule create(TableDefContainer tableDefContainer, Clock clock, SpreadsheetConfig config) {
        engine = new CalculationEngine(config.bounds(), FunctionRegistry.withBuiltIns());

        ColumnBuilder sheetColumns = new ColumnBuilder().addInt(ROW_COLUMN);
        for (int col = 0; col < config.cols(); col++) {
            sheetColumns.addString(CellRef.columnName(col), true);
        }

        return ModuleFactory.withNamespace(NAME, tableDefContainer)
                .addTable(new TableDefBuilder()
                                .name(SHEET_TABLE)
                                .keyField(ROW_COLUMN)
                                .customColumns(sheetColumns.build())
                                .defaultSort(new SortSpecBuilder().addAscending(ROW_COLUMN).build())
                                .isEditable(true)
                                .build(),
                        (table, vs) -> new SheetProvider(table, engine),
                        (table, provider, providerContainer, tableContainer) -> new ViewPortDef(
                                table.getTableDef().getColumns(),
                                new SpreadsheetEditRpcHandler(engine, config.editTimeout())
                        )
                )
                .addTable(new TableDefBuilder()
                                .name(SHEET_CELLS_TABLE)
                                .keyField("cellRef")
                                .customColumns(new ColumnBuilder()
                                        .addString("cellRef")
                                        .addInt("col")
                                        .addInt("row")
                                        .addString("input")
                                        .addString("value")
                                        .addString("valueType")
                                        .addString("precedents")
                                        .addString("dependents")
                                        .addLong("lastCalcSeq")
                                        .build())
                                .defaultSort(new SortSpecBuilder().addAscending("col").addAscending("row").build())
                                .build(),
                        (table, vs) -> new SheetCellsProvider(table, engine)
                )
                .asModule();
    }

    /** The engine behind the tables; available once {@link #create} has been called. */
    public CalculationEngine engine() {
        return engine;
    }
}
