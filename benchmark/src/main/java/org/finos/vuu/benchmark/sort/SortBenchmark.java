package org.finos.vuu.benchmark.sort;

import org.finos.vuu.benchmark.BenchmarkHelper;
import org.finos.vuu.core.sort.GenericSort2;
import org.finos.vuu.core.sort.Sort;
import org.finos.vuu.core.sort.SortDirection;
import org.finos.vuu.core.table.DataTable;
import org.finos.vuu.core.table.ViewPortColumnCreator;
import org.finos.vuu.net.SortDef;
import org.finos.vuu.net.SortSpec;
import org.finos.vuu.viewport.ViewPortColumns;

import java.util.List;

import static org.finos.vuu.util.ScalaCollectionConverter.toScala;

public class SortBenchmark {

    private final DataTable inMemDataTable;
    private final ViewPortColumns viewPortColumns;
    private final Sort sort;

    public SortBenchmark(BenchmarkHelper benchmarkHelper, int size) {
        inMemDataTable = benchmarkHelper.buildTable();
        viewPortColumns = ViewPortColumnCreator.create(inMemDataTable, toScala(List.of("exchange")));
        sort = new GenericSort2(
                SortSpec.apply(toScala(List.of(SortDef.apply("exchange", SortDirection.ASCENDING().external())))),
                toScala(List.of(inMemDataTable.getTableDef().columnForName("exchange"))));
        benchmarkHelper.addTableData(inMemDataTable, size);
    }

    void sortLargeTable() {
        sort.doSort(inMemDataTable, inMemDataTable.primaryKeys(), viewPortColumns);
    }

}
