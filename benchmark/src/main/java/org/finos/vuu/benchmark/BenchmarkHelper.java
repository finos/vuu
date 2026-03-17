package org.finos.vuu.benchmark;

import org.finos.toolbox.jmx.MetricsProvider;
import org.finos.toolbox.jmx.MetricsProviderImpl;
import org.finos.toolbox.lifecycle.LifecycleContainer;
import org.finos.toolbox.time.Clock;
import org.finos.toolbox.time.DefaultClock;
import org.finos.vuu.core.filter.type.AllowAllPermissionFilter$;
import org.finos.vuu.core.table.Column;
import org.finos.vuu.core.table.DataTable;
import org.finos.vuu.core.table.TableContainer;
import org.finos.vuu.core.table.ViewPortColumnCreator;
import org.finos.vuu.core.tree.TreeSessionTable;
import org.finos.vuu.net.ClientSessionId;
import org.finos.vuu.net.FilterSpec;
import org.finos.vuu.provider.JoinTableProvider;
import org.finos.vuu.provider.JoinTableProviderImpl;
import org.finos.vuu.viewport.GroupBy;
import org.finos.vuu.viewport.tree.BuildEntireTree;
import org.finos.vuu.viewport.tree.TreeBuilder;
import org.finos.vuu.viewport.tree.TreeNodeStateStore;
import scala.Option;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.finos.vuu.benchmark.ColumnNames.ASK;
import static org.finos.vuu.benchmark.ColumnNames.BID;
import static org.finos.vuu.benchmark.ColumnNames.CLOSE;
import static org.finos.vuu.benchmark.ColumnNames.CURRENCY;
import static org.finos.vuu.benchmark.ColumnNames.EXCHANGE;
import static org.finos.vuu.benchmark.ColumnNames.LAST;
import static org.finos.vuu.benchmark.ColumnNames.MINOR_CURRENCY;
import static org.finos.vuu.benchmark.ColumnNames.ORDER_ID;
import static org.finos.vuu.benchmark.ColumnNames.QUANTITY;
import static org.finos.vuu.benchmark.ColumnNames.RIC;
import static org.finos.vuu.benchmark.ColumnNames.TRADER;
import static org.finos.vuu.benchmark.ColumnNames.TRADE_TIME;
import static org.finos.vuu.benchmark.TableDefs.CURRENCIES;
import static org.finos.vuu.benchmark.TableDefs.CURRENCIES_NAME;
import static org.finos.vuu.benchmark.TableDefs.ORDERS;
import static org.finos.vuu.benchmark.TableDefs.ORDERS_NAME;
import static org.finos.vuu.benchmark.TableDefs.ORDER_PRICES_CURRENCIES;
import static org.finos.vuu.benchmark.TableDefs.PRICES;
import static org.finos.vuu.benchmark.TableDefs.PRICES_CURRENCIES;
import static org.finos.vuu.benchmark.TableDefs.PRICES_NAME;
import static org.finos.vuu.util.ScalaCollectionConverter.toScala;

public class BenchmarkHelper {

    private final Clock clock = new DefaultClock();
    private final LifecycleContainer lifecycleContainer = new LifecycleContainer(clock);
    private final MetricsProvider metricsProvider = new MetricsProviderImpl();
    private final JoinTableProvider joinProvider = JoinTableProviderImpl.apply(lifecycleContainer);
    private final TableContainer tableContainer = new TableContainer(joinProvider, metricsProvider, clock);

    public BenchmarkHelper() {
        tableContainer.createTable(CURRENCIES);
        tableContainer.createTable(ORDERS);
        tableContainer.createTable(PRICES);
        tableContainer.createJoinTable(PRICES_CURRENCIES);
        tableContainer.createJoinTable(ORDER_PRICES_CURRENCIES);
    }

    public Clock getClock() {
        return clock;
    }

    public DataTable getDataTable(String name) {
        return tableContainer.getTable(name);
    }

    public void addCurrencyTableData() {
        var dataTable = tableContainer.getTable(CURRENCIES_NAME);
        var rowBuilder = dataTable.rowBuilder();
        rowBuilder.setKey("GBP");
        rowBuilder.setString(dataTable.columnForName(CURRENCY), "GBP");
        rowBuilder.setString(dataTable.columnForName(MINOR_CURRENCY), "GBX");
        dataTable.processUpdate(rowBuilder.build());
        joinProvider.runOnce();
    }

    public void addPriceTableData(int size) {
        var dataTable = tableContainer.getTable(PRICES_NAME);
        var rowBuilder = dataTable.rowBuilder();
        var ricColumn = dataTable.columnForName(RIC);
        var currencyColumn = dataTable.columnForName(CURRENCY);
        var exchangeColumn = dataTable.columnForName(EXCHANGE);
        var bidColumn = dataTable.columnForName(BID);
        var askColumn = dataTable.columnForName(ASK);
        var lastColumn = dataTable.columnForName(LAST);
        var closeColumn = dataTable.columnForName(CLOSE);
        for (int i = 0; i < size; i++) {
            var ric = "TST-" + i;
            rowBuilder.setKey(ric);
            rowBuilder.setString(ricColumn, ric);
            rowBuilder.setString(exchangeColumn, "exchange-" + i);
            rowBuilder.setString(currencyColumn, "GBP");
            rowBuilder.setDouble(bidColumn, i + 1.0);
            rowBuilder.setDouble(askColumn, i + 2.0);
            rowBuilder.setDouble(lastColumn, i + 3.0);
            rowBuilder.setDouble(closeColumn, i + 4.0);
            dataTable.processUpdate(rowBuilder.build());
            if (i % 10_000 == 0) {
                joinProvider.runOnce();
            }
        }
        joinProvider.runOnce();
    }

    public void addOrderTableData(int size) {
        var dataTable = tableContainer.getTable(ORDERS_NAME);
        var rowBuilder = dataTable.rowBuilder();
        var orderIdColumn = dataTable.columnForName(ORDER_ID);
        var ricColumn = dataTable.columnForName(RIC);
        var traderColumn = dataTable.columnForName(TRADER);
        var tradeTimeColumn = dataTable.columnForName(TRADE_TIME);
        var quantityColumn = dataTable.columnForName(QUANTITY);
        for (int i = 0; i < size; i++) {
            var orderId = String.valueOf(i);
            rowBuilder.setKey(orderId);
            rowBuilder.setString(orderIdColumn, orderId);
            rowBuilder.setString(ricColumn, "TST-" + i % 10);
            rowBuilder.setString(traderColumn, "trader@firm.com");
            rowBuilder.setLong(tradeTimeColumn, clock.now());
            rowBuilder.setDouble(quantityColumn, i);
            dataTable.processUpdate(rowBuilder.build());
            if (i % 10_000 == 0) {
                joinProvider.runOnce();
            }
        }
        joinProvider.runOnce();
    }

    public TreeBuilder createTreeBuilder() {
        var table = tableContainer.getTable(PRICES_NAME);

        var client = new ClientSessionId("A", "C");

        var groupByTable = TreeSessionTable.apply(table, client, joinProvider, metricsProvider, clock);
        var exchange = table.getTableDef().columnForName("exchange");

        var columns = ViewPortColumnCreator.create(groupByTable,
                toScala(Arrays.stream(table.getTableDef().getColumns()).map(Column::name).toList()));

        return TreeBuilder.create(groupByTable,
                new GroupBy(toScala(List.of(exchange)), toScala(List.of())),
                FilterSpec.apply(""),
                columns,
                TreeNodeStateStore.apply(toScala(Map.of())),
                Option.empty(),
                Option.empty(),
                BuildEntireTree.apply(groupByTable, Option.empty()),
                AllowAllPermissionFilter$.MODULE$,
                Option.empty(),
                clock);
    }

}
