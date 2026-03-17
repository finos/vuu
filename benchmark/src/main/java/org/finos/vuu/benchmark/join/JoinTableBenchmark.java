package org.finos.vuu.benchmark.join;

import org.finos.vuu.benchmark.BenchmarkHelper;
import org.finos.vuu.core.table.DataTable;
import org.openjdk.jmh.infra.Blackhole;

import static org.finos.vuu.benchmark.TableDefs.ORDER_PRICES_CURRENCIES_NAME;

public class JoinTableBenchmark {

    private final BenchmarkHelper benchmarkHelper;
    private final DataTable dataTable;

    public JoinTableBenchmark(BenchmarkHelper benchmarkHelper) {
        this.benchmarkHelper = benchmarkHelper;
        this.dataTable = benchmarkHelper.getDataTable(ORDER_PRICES_CURRENCIES_NAME);
    }

    public void addRows(int size) {
        benchmarkHelper.addCurrencyTableData();
        benchmarkHelper.addPriceTableData(10);
        benchmarkHelper.addOrderTableData(size);
    }

    public void iterateRows(Blackhole bh) {
        dataTable.primaryKeys().foreach(v1 -> {
            bh.consume(dataTable.pullRow(v1));
            return null;
        });
    }

}
