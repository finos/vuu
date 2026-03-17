package org.finos.vuu.benchmark.sort;

import org.finos.vuu.benchmark.BenchmarkHelper;
import org.finos.vuu.benchmark.TableDefs;
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
import static org.finos.vuu.benchmark.ColumnNames.CLOSE;
import static org.finos.vuu.benchmark.ColumnNames.EXCHANGE;
import static org.finos.vuu.util.ScalaCollectionConverter.toScala;

public class SortBenchmark {

    private final DataTable inMemDataTable;
    private final ViewPortColumns viewPortColumns;
    private final Sort singleSort;
    private final Sort multiSort;

    public SortBenchmark(BenchmarkHelper benchmarkHelper, int size) {
        inMemDataTable = benchmarkHelper.getDataTable(TableDefs.PRICES_NAME);
        viewPortColumns = ViewPortColumnCreator.create(inMemDataTable,
                toScala(stream(inMemDataTable.getTableDef().getColumns()).map(Column::name).toList()));
        var closeColumn = inMemDataTable.getTableDef().columnForName(CLOSE);
        var exchangeColumn = inMemDataTable.getTableDef().columnForName(EXCHANGE);
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
        benchmarkHelper.addPriceTableData(size);
    }

    void sortLargeTableSingleColumn() {
        singleSort.doSort(inMemDataTable, inMemDataTable.primaryKeys(), viewPortColumns);
    }

    void sortLargeTableMultiColumn() {
        multiSort.doSort(inMemDataTable, inMemDataTable.primaryKeys(), viewPortColumns);
    }

}
