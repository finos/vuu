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
        dataTable.primaryKeys().foreach(v1 -> {
            bh.consume(dataTable.pullRow(v1));
            return null;
        });
    }

    public void removeRows(int size) {
        for (int i = 0; i < size; i++) {
            dataTable.processDelete(dataTable.primaryKeys().head());
        }
    }

    public void updateRows(int size) {
        for (int i = 0; i < size; i++) {
            var existingRow = dataTable.pullRow(dataTable.primaryKeys().head());
            dataTable.processUpdate(existingRow);
        }
    }

}
