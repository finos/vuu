package org.finos.vuu.benchmark.sort;

import org.finos.vuu.benchmark.BenchmarkHelper;
import org.finos.vuu.core.sort.Sort;
import org.finos.vuu.core.sort.SortDirection;
import org.finos.vuu.core.table.Column;
import org.finos.vuu.core.table.DataTable;
import org.finos.vuu.core.table.ViewPortColumnCreator;
import org.finos.vuu.net.SortDef;
import org.finos.vuu.net.SortSpec;
import org.finos.vuu.viewport.ViewPortColumns;

import java.util.List;

import static java.util.Arrays.stream;
import static org.finos.vuu.util.ScalaCollectionConverter.toScala;

public class SortBenchmark {

    private final DataTable inMemDataTable;
    private final ViewPortColumns viewPortColumns;
    private final Sort singleSort;
    private final Sort multiSort;

    public SortBenchmark(BenchmarkHelper benchmarkHelper, int size) {
        inMemDataTable = benchmarkHelper.buildTable();
        viewPortColumns = ViewPortColumnCreator.create(inMemDataTable,
                toScala(stream(inMemDataTable.getTableDef().getColumns()).map(Column::name).toList()));
        var closeColumn = inMemDataTable.getTableDef().columnForName("close");
        var exchangeColumn = inMemDataTable.getTableDef().columnForName("exchange");
        singleSort = Sort.apply(
                SortSpec.apply(toScala(List.of(
                        SortDef.apply(exchangeColumn.name(), SortDirection.ASCENDING().external())
                ))),
                toScala(List.of(exchangeColumn)));
        multiSort = Sort.apply(
                SortSpec.apply(toScala(List.of(
                        SortDef.apply(exchangeColumn.name(), SortDirection.DESCENDING().external()),
                        SortDef.apply(closeColumn.name(), SortDirection.ASCENDING().external())
                ))),
                toScala(List.of(exchangeColumn, closeColumn)));
        benchmarkHelper.addTableData(inMemDataTable, size);
    }

    void sortLargeTableSingleColumn() {
        singleSort.doSort(inMemDataTable, inMemDataTable.primaryKeys(), viewPortColumns);
    }

    void sortLargeTableMultiColumn() {
        multiSort.doSort(inMemDataTable, inMemDataTable.primaryKeys(), viewPortColumns);
    }

}
