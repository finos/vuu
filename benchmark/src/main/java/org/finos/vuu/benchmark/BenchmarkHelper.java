package org.finos.vuu.benchmark;

import org.finos.toolbox.jmx.MetricsProvider;
import org.finos.toolbox.jmx.MetricsProviderImpl;
import org.finos.toolbox.lifecycle.LifecycleContainer;
import org.finos.toolbox.time.Clock;
import org.finos.toolbox.time.DefaultClock;
import org.finos.vuu.api.Index;
import org.finos.vuu.api.Indices;
import org.finos.vuu.api.TableDef;
import org.finos.vuu.core.filter.type.AllowAllPermissionFilter$;
import org.finos.vuu.core.table.Column;
import org.finos.vuu.core.table.Columns;
import org.finos.vuu.core.table.DataTable;
import org.finos.vuu.core.table.InMemDataTable;
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

import static org.finos.vuu.util.ScalaCollectionConverter.toScala;
import static org.finos.vuu.util.ScalaCollectionConverter.toScalaSeq;

public class BenchmarkHelper {

    private final Clock clock = new DefaultClock();
    private final LifecycleContainer lifecycleContainer = new LifecycleContainer(clock);
    private final MetricsProvider metricsProvider = new MetricsProviderImpl();
    private final JoinTableProvider joinProvider = JoinTableProviderImpl.apply(lifecycleContainer);

    public Clock getClock() {
        return clock;
    }

    public DataTable buildTable() {
        return buildTable(0);
    }

    public DataTable buildTable(int size) {
        var pricesDef = TableDef.apply(
                "prices",
                "ric",
                Columns.fromNames(new String[]{"ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double", "exchange:String"}),
                Indices.apply(toScala(List.of(Index.apply("exchange")))),
                toScalaSeq(List.of("ric"))
        );
        var dataTable = new InMemDataTable(pricesDef, joinProvider, metricsProvider, clock);
        addTableData(dataTable, size);
        return dataTable;
    }

    public void addTableData(DataTable dataTable, int size) {
        addTableData(dataTable, 0, size);
    }

    public void addTableData(DataTable dataTable, int offset, int size) {
        var rowBuilder = dataTable.rowBuilder();
        var ricColumn = dataTable.columnForName("ric");
        var exchangeColumn = dataTable.columnForName("exchange");
        var bidColumn = dataTable.columnForName("bid");
        var askColumn = dataTable.columnForName("ask");
        var lastColumn = dataTable.columnForName("last");
        var closeColumn = dataTable.columnForName("close");
        for (int i = offset; i < offset + size; i++) {
            var ric = "TST-" + i;
            rowBuilder.setKey(ric);
            rowBuilder.setString(ricColumn, ric);
            rowBuilder.setString(exchangeColumn, "exchange-" + i);
            rowBuilder.setDouble(bidColumn, 101);
            rowBuilder.setDouble(askColumn, 100);
            rowBuilder.setDouble(lastColumn, 105);
            rowBuilder.setDouble(closeColumn, 106);
            dataTable.processUpdate(rowBuilder.build());
        }
    }

    public TreeBuilder createTreeBuilder(DataTable table) {
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
