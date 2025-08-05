package org.finos.vuu.benchmark;

import org.finos.toolbox.jmx.MetricsProvider;
import org.finos.toolbox.jmx.MetricsProviderImpl;
import org.finos.toolbox.lifecycle.LifecycleContainer;
import org.finos.toolbox.time.Clock;
import org.finos.toolbox.time.DefaultClock;
import org.finos.vuu.api.Index;
import org.finos.vuu.api.Indices;
import org.finos.vuu.api.TableDef;
import org.finos.vuu.core.table.*;
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
    private final JoinTableProvider joinProvider = JoinTableProviderImpl.apply(clock, lifecycleContainer, metricsProvider);

    public Clock getClock() {
        return clock;
    }

    public InMemDataTable buildBigTable(int size) {
        var pricesDef = TableDef.apply(
                "prices",
                "ric",
                Columns.fromNames(new String[]{"ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double", "exchange:String"}),
                Indices.apply(toScala(List.of(Index.apply("exchange")))),
                toScalaSeq(List.of("ric"))
        );
        var table = new InMemDataTable(pricesDef, joinProvider, metricsProvider, clock);

        for (int i = 0; i <= size; i++) {
            var ric = "TST-" + i;
            var exchange = "exchange-" + i;
            var row = new RowWithData(ric, Map.of(
                    "ric", ric,
                    "bid", 101,
                    "ask", 100,
                    "last", 105,
                    "close", 106,
                    "exchange", exchange
            ));
            table.processUpdate(ric, row, clock.now());
        }
        return table;
    }

    public TreeBuilder createTreeBuilder(InMemDataTable table) {
        var client = new ClientSessionId("A", "B");

        var groupByTable = TreeSessionTable.apply(table, client, joinProvider, metricsProvider, clock);
        var exchange = table.getTableDef().columnForName("exchange");

        var columns = ViewPortColumnCreator.create(groupByTable,
                toScala(Arrays.stream(table.columns()).map(Column::name).toList()));

        return TreeBuilder.create(groupByTable,
                new GroupBy(toScala(List.of(exchange)), toScala(List.of())),
                FilterSpec.apply(""),
                columns,
                TreeNodeStateStore.apply(toScala(Map.of())),
                Option.empty(),
                Option.empty(),
                BuildEntireTree.apply(groupByTable, Option.empty()),
                Option.empty(),
                clock);
    }

}
