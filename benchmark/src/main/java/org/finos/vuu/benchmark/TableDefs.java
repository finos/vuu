package org.finos.vuu.benchmark;

import org.finos.vuu.api.Index;
import org.finos.vuu.api.Indices;
import org.finos.vuu.api.JoinSpec;
import org.finos.vuu.api.JoinTableDef;
import org.finos.vuu.api.JoinTo;
import org.finos.vuu.api.LeftOuterJoin$;
import org.finos.vuu.api.TableDef;
import org.finos.vuu.api.VisualLinks;
import org.finos.vuu.core.table.Column;
import org.finos.vuu.core.table.Columns;

import java.util.List;
import java.util.stream.Stream;

import static org.finos.vuu.benchmark.ColumnNames.ASK;
import static org.finos.vuu.benchmark.ColumnNames.BID;
import static org.finos.vuu.benchmark.ColumnNames.CLOSE;
import static org.finos.vuu.benchmark.ColumnNames.CURRENCY;
import static org.finos.vuu.benchmark.ColumnNames.EXCHANGE;
import static org.finos.vuu.benchmark.ColumnNames.LAST;
import static org.finos.vuu.benchmark.ColumnNames.MINOR_CURRENCY;
import static org.finos.vuu.benchmark.ColumnNames.OPEN;
import static org.finos.vuu.benchmark.ColumnNames.ORDER_ID;
import static org.finos.vuu.benchmark.ColumnNames.QUANTITY;
import static org.finos.vuu.benchmark.ColumnNames.RIC;
import static org.finos.vuu.benchmark.ColumnNames.TRADER;
import static org.finos.vuu.benchmark.ColumnNames.TRADE_TIME;
import static org.finos.vuu.util.ScalaCollectionConverter.emptySeq;
import static org.finos.vuu.util.ScalaCollectionConverter.toScala;
import static org.finos.vuu.util.ScalaCollectionConverter.toScalaSeq;

public class TableDefs {

    private TableDefs() { }

    public static final String CURRENCIES_NAME = "currencies";
    public static final TableDef CURRENCIES = TableDef.apply(
            CURRENCIES_NAME,
            CURRENCY,
            Columns.fromNames(new String[]{ CURRENCY+ ":String", MINOR_CURRENCY + ":String"}),
            Indices.apply(emptySeq()),
            toScalaSeq(List.of(CURRENCY))
    );

    public static final String PRICES_NAME = "prices";
    public static final TableDef PRICES = TableDef.apply(
            PRICES_NAME,
            RIC,
            Columns.fromNames(new String[]{RIC + ":String", BID + ":Double", ASK+ ":Double", LAST+ ":Double", OPEN + ":Double",
                    CLOSE + ":Double", EXCHANGE+ ":String", CURRENCY+ ":String"}),
            Indices.apply(toScala(List.of(Index.apply("exchange")))),
            toScalaSeq(List.of(RIC, CURRENCY))
    );

    public static final String ORDERS_NAME = "orders";
    public static final TableDef ORDERS = TableDef.apply(
            ORDERS_NAME,
            ORDER_ID,
            Columns.fromNames(new String[]{ORDER_ID + ":String", TRADER + ":String", RIC + ":String",
                    TRADE_TIME + ":Long", QUANTITY + ":Double"}),
            Indices.apply(emptySeq()),
            toScalaSeq(List.of(ORDER_ID, RIC))
    );

    public static final String PRICES_CURRENCIES_NAME = "pricesCurrencies";
    public static final JoinTableDef PRICES_CURRENCIES = JoinTableDef.apply(
            PRICES_CURRENCIES_NAME,
            PRICES,
            concatColumns(Columns.allFrom(PRICES),
                    Columns.allFromExceptDefaultAnd(CURRENCIES, toScala(List.of(CURRENCY)))),
            VisualLinks.apply(emptySeq()),
            toScala(List.of(RIC)),
            JoinTo.apply(CURRENCIES, JoinSpec.apply(CURRENCY, CURRENCY, LeftOuterJoin$.MODULE$))
    );

    public static final String ORDER_PRICES_CURRENCIES_NAME = "orderPricesCurrencies";
    public static final JoinTableDef ORDER_PRICES_CURRENCIES = JoinTableDef.apply(
            ORDER_PRICES_CURRENCIES_NAME,
            ORDERS,
            concatColumns(Columns.allFrom(ORDERS),
                    Columns.allFromExceptDefaultAnd(PRICES_CURRENCIES, toScala(List.of(RIC)))),
            VisualLinks.apply(emptySeq()),
            emptySeq(),
            JoinTo.apply(PRICES_CURRENCIES, JoinSpec.apply(RIC, RIC, LeftOuterJoin$.MODULE$))
    );

    private static Column[] concatColumns(Column[] a, Column[] b) {
        return Stream.concat(Stream.of(a), Stream.of(b))
                .toArray(Column[]::new);
    }

}
