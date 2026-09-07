package org.finos.vuu.benchmark;

import org.finos.vuu.api.ColumnBuilder;
import org.finos.vuu.api.JoinTableDef;
import org.finos.vuu.api.TableDef;
import org.finos.vuu.core.table.Column;
import org.finos.vuu.core.table.Columns;
import org.finos.vuu.api.JoinTableDefBuilder;
import org.finos.vuu.api.JoinToBuilder;
import org.finos.vuu.api.TableDefBuilder;

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
import static org.finos.vuu.util.ScalaCollectionConverter.toScala;

public class TableDefs {

    private TableDefs() { }

    public static final String CURRENCIES_NAME = "currencies";
    public static final TableDef CURRENCIES = new TableDefBuilder()
            .name(CURRENCIES_NAME)
            .keyField(CURRENCY)
            .customColumns(
                    new ColumnBuilder()
                            .addString(CURRENCY)
                            .addString(MINOR_CURRENCY)
                            .build()
            )
            .joinFields(List.of(CURRENCY))
            .build();

    public static final String PRICES_NAME = "prices";
    public static final TableDef PRICES = new TableDefBuilder()
            .name(PRICES_NAME)
            .keyField(RIC)
            .customColumns(
                    new ColumnBuilder()
                            .addString(RIC)
                            .addDouble(BID)
                            .addDouble(ASK)
                            .addDouble(LAST)
                            .addDouble(OPEN)
                            .addDouble(CLOSE)
                            .addString(EXCHANGE)
                            .addString(CURRENCY)
                            .build()
            )
            .joinFields(List.of(RIC, CURRENCY))
            .indexFields(List.of(EXCHANGE))
            .build();

    public static final String ORDERS_NAME = "orders";
    public static final TableDef ORDERS = new TableDefBuilder()
            .name(ORDERS_NAME)
            .keyField(ORDER_ID)
            .customColumns(
                    new ColumnBuilder()
                            .addString(ORDER_ID)
                            .addString(TRADER)
                            .addString(RIC)
                            .addLong(TRADE_TIME)
                            .addDouble(QUANTITY)
                            .build()
            )
            .joinFields(List.of(ORDER_ID, RIC))
            .build();

    public static final String PRICES_CURRENCIES_NAME = "pricesCurrencies";
    public static final JoinTableDef PRICES_CURRENCIES = new JoinTableDefBuilder()
            .name(PRICES_CURRENCIES_NAME)
            .baseTable(PRICES)
            .joinColumns(concatColumns(Columns.allFrom(PRICES),
                    Columns.allFromExceptDefaultAnd(CURRENCIES, toScala(List.of(CURRENCY)))))
            .joinTos(List.of(
                    new JoinToBuilder()
                            .table(CURRENCIES)
                            .leftKey(CURRENCY)
                            .rightKey(CURRENCY)
                            .build()
            ))
            .joinFields(List.of(RIC))
            .build();

    public static final String ORDER_PRICES_CURRENCIES_NAME = "orderPricesCurrencies";
    public static final JoinTableDef ORDER_PRICES_CURRENCIES = new JoinTableDefBuilder()
            .name(ORDER_PRICES_CURRENCIES_NAME)
            .baseTable(ORDERS)
            .joinColumns(concatColumns(Columns.allFrom(ORDERS),
                    Columns.allFromExceptDefaultAnd(PRICES_CURRENCIES, toScala(List.of(RIC)))))
            .joinTos(List.of(
                    new JoinToBuilder()
                            .table(PRICES_CURRENCIES)
                            .leftKey(RIC)
                            .rightKey(RIC)
                            .build()
            ))
            .build();

    private static Column[] concatColumns(Column[] a, Column[] b) {
        return Stream.concat(Stream.of(a), Stream.of(b))
                .toArray(Column[]::new);
    }

}
