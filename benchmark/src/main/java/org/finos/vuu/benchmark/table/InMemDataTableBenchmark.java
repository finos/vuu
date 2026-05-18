package org.finos.vuu.benchmark.table;

import org.finos.vuu.benchmark.BenchmarkHelper;
import org.finos.vuu.benchmark.TableDefs;
import org.finos.vuu.core.table.DataTable;
import org.openjdk.jmh.infra.Blackhole;

public class InMemDataTableBenchmark {

    private final BenchmarkHelper benchmarkHelper;
    private final DataTable dataTable;

    public InMemDataTableBenchmark(BenchmarkHelper benchmarkHelper) {
        this.benchmarkHelper = benchmarkHelper;
        this.dataTable = benchmarkHelper.getDataTable(TableDefs.PRICES_NAME);
    }

    public void addRows(int size) {
        benchmarkHelper.addPriceTableData(size);
    }

    public void iterateRows(Blackhole bh) {
        var keys = dataTable.primaryKeys();
        for (int i = 0; i < keys.size(); i++) {
            bh.consume(dataTable.pullRow(keys.get(i)));
        }
    }

    public void removeRows(int size) {
        var keys = dataTable.primaryKeys();
        for (int i = 0; i < size; i++) {
            dataTable.processDelete(keys.get(i));
            benchmarkHelper.runJoinProviderIfRequired(i);
        }
        benchmarkHelper.runJoinProvider();
    }

    public void updateRows(int size) {
        var keys = dataTable.primaryKeys();
        for (int i = 0; i < size; i++) {
            var existingRow = dataTable.pullRow(keys.get(i));
            dataTable.processUpdate(existingRow);
            benchmarkHelper.runJoinProviderIfRequired(i);
        }
        benchmarkHelper.runJoinProvider();
    }

}
