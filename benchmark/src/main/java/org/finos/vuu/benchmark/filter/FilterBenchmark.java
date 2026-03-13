package org.finos.vuu.benchmark.filter;

import org.finos.vuu.benchmark.BenchmarkHelper;
import org.finos.vuu.core.filter.EqualsClause;
import org.finos.vuu.core.filter.FilterClause;
import org.finos.vuu.core.filter.LessThanClause;
import org.finos.vuu.core.filter.StartsClause;
import org.finos.vuu.core.table.Column;
import org.finos.vuu.core.table.DataTable;
import org.finos.vuu.core.table.ViewPortColumnCreator;
import org.finos.vuu.viewport.ViewPortColumns;
import org.openjdk.jmh.infra.Blackhole;

import static java.util.Arrays.stream;
import static org.finos.vuu.util.ScalaCollectionConverter.toScala;

public class FilterBenchmark {

    private final DataTable inMemDataTable;
    private final ViewPortColumns viewPortColumns;
    private final FilterClause equalsFilter;
    private final FilterClause startsWithFilter;
    private final FilterClause lessThanFilter;

    public FilterBenchmark(BenchmarkHelper benchmarkHelper, int size) {
        inMemDataTable = benchmarkHelper.buildTable();
        benchmarkHelper.addTableData(inMemDataTable, size);
        viewPortColumns = ViewPortColumnCreator.create(inMemDataTable,
                toScala(stream(inMemDataTable.getTableDef().getColumns()).map(Column::name).toList()));
        var lastRow = inMemDataTable.pullRow(inMemDataTable.primaryKeys().last());
        var exchangeColumn = inMemDataTable.getTableDef().columnForName("exchange");
        var closeColumn = inMemDataTable.getTableDef().columnForName("close");
        equalsFilter = new EqualsClause(exchangeColumn.name(), lastRow.get(exchangeColumn).toString());
        startsWithFilter = new StartsClause(exchangeColumn.name(), "exchange-1");
        lessThanFilter = new LessThanClause(closeColumn.name(), String.valueOf(size / 2));
    }

    void equalsFilter(Blackhole bh) {
        bh.consume(equalsFilter.filterAllSafe(inMemDataTable, inMemDataTable.primaryKeys(), viewPortColumns, true));
    }

    void startsWithFilter(Blackhole bh) {
        bh.consume(startsWithFilter.filterAllSafe(inMemDataTable, inMemDataTable.primaryKeys(), viewPortColumns, true));
    }

    void lessThanFilter(Blackhole bh) {
        bh.consume(lessThanFilter.filterAllSafe(inMemDataTable, inMemDataTable.primaryKeys(), viewPortColumns, true));
    }

}
