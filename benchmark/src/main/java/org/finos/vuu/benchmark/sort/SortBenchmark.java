package org.finos.vuu.benchmark.sort;

import org.finos.vuu.benchmark.BenchmarkHelper;
import org.finos.vuu.core.sort.GenericSort2;
import org.finos.vuu.core.table.InMemDataTable;
import org.finos.vuu.core.table.ViewPortColumnCreator;
import org.finos.vuu.net.SortDef;
import org.finos.vuu.net.SortSpec;

import java.util.List;

import static org.finos.vuu.util.ScalaCollectionConverter.toScala;

public class SortBenchmark {

    private final InMemDataTable inMemDataTable;

    public SortBenchmark(BenchmarkHelper benchmarkHelper, int size) {
        this.inMemDataTable = benchmarkHelper.buildBigTable(size);
    }

    void sortLargeTable() {
        var sort = new GenericSort2(
                SortSpec.apply(toScala(List.of(SortDef.apply("exchange", 'A')))),
                toScala(List.of(inMemDataTable.getTableDef().columnForName("exchange"))));
        var viewPortColumns = ViewPortColumnCreator.create(inMemDataTable, toScala(List.of("exchange")));
        sort.doSort(inMemDataTable, inMemDataTable.primaryKeys(), viewPortColumns);
    }

}
