package org.finos.vuu.module;

import org.finos.toolbox.time.Clock;
import org.finos.vuu.api.ColumnBuilder;
import org.finos.vuu.api.ViewPortDef;
import org.finos.vuu.core.module.DefaultModule;
import org.finos.vuu.core.module.ModuleFactory;
import org.finos.vuu.core.module.TableDefContainer;
import org.finos.vuu.core.module.ViewServerModule;
import org.finos.vuu.core.table.Columns;
import org.finos.vuu.core.table.DataTable;
import org.finos.vuu.core.table.DefaultColumn;
import org.finos.vuu.core.table.TableContainer;
import org.finos.vuu.net.rpc.AllowAllRpcPermissionChecker$;
import org.finos.vuu.net.rpc.DefaultRpcHandlerImpl;
import org.finos.vuu.net.rpc.RpcHandler;
import org.finos.vuu.person.rpc.DeleteRecordRpcHandler;
import org.finos.vuu.person.rpc.DeleteRecordRpcHandlerIF;
import org.finos.vuu.person.rpc.EditPersonRecordRpcHandler;
import org.finos.vuu.person.rpc.ImportRecordRpcHandler;
import org.finos.vuu.person.rpc.PersonRpcHandler;
import org.finos.vuu.person.auto.AutoMappedPersonProvider;
import org.finos.vuu.person.auto.EntitySchema;
import org.finos.vuu.person.datasource.PersonStore;
import org.finos.vuu.person.manual.PersonProvider;
import org.finos.vuu.net.rpc.RpcHandlerBuilder;
import org.finos.vuu.api.SessionTableDefBuilder;
import org.finos.vuu.net.SortSpecBuilder;
import org.finos.vuu.api.TableDefBuilder;

public class JavaExampleModule extends DefaultModule {

    public static final String NAME = "JAVA_EXAMPLE";

    public ViewServerModule create(final TableDefContainer tableDefContainer, Clock clock) {

        return ModuleFactory.withNamespace(NAME, tableDefContainer)
                .addTable(new TableDefBuilder()
                                .name("PersonManualMapped")
                                .keyField("id")
                                .customColumns(new ColumnBuilder()
                                        .addString("id")
                                        .addString("name")
                                        .addInt("account")
                                        .build())
                                .defaultSort(new SortSpecBuilder()
                                        .addAscending(DefaultColumn.CREATED_TIME().name())
                                        .build())
                                .build(),
                        (table, vs) -> new PersonProvider(table, new PersonStore()),
                        (table, provider, providerContainer, tableContainer) -> new ViewPortDef(
                                table.getTableDef().getColumns(),
                                buildRpcHandler2(table)
                        )
                )
                .addTable(new TableDefBuilder()
                                .name("PersonManualMapped2")
                                .keyField("id")
                                .customColumns(new ColumnBuilder()
                                        .addString("id")
                                        .addString("name")
                                        .addInt("account")
                                        .build())
                                .defaultSort(new SortSpecBuilder()
                                        .addAscending(DefaultColumn.CREATED_TIME().name())
                                        .build())
                                .build(),
                        (table, vs) -> new PersonProvider(table, new PersonStore()),
                        (table, provider, providerContainer, tableContainer) -> new ViewPortDef(
                                table.getTableDef().getColumns(),
                                buildRpcHandler3(tableContainer)
                        )
                )
                .addTable(new TableDefBuilder()
                                .name("PersonManualMapped3")
                                .keyField("id")
                                .customColumns(new ColumnBuilder().addString("id").addString("name")
                                        .addInt("account").build())
                                .build(),
                        (table, vs) -> new PersonProvider(table, new PersonStore()),
                        (table, p, pc, tableContainer) -> new ViewPortDef(
                                table.getTableDef().getColumns(),
                                buildImportRpcHandler(tableContainer)
                        )
                )
                .addSessionTable(new SessionTableDefBuilder()
                                .name("export-PersonManualMapped2")
                                .keyField("Id")
                                .customColumns(new ColumnBuilder()
                                        .addString("id")
                                        .addString("name")
                                        .addInt("account")
                                        .build())
                                .build(),
                        (table, provider, providerContainer, tableContainer) -> ViewPortDef.createDefault(new ColumnBuilder()
                                .addString("id")
                                .addString("name")
                                .addInt("account")
                                .build()))
                .addTable(new TableDefBuilder()
                                .name("PersonAutoMapped")
                                .keyField("id")
                                .customColumns(Columns.fromExternalSchema(EntitySchema.person))
                                .build(),
                        (table, vs) -> new AutoMappedPersonProvider(table, new PersonStore())
                )
                .asModule();
    }

    private RpcHandler buildRpcHandler(DataTable table) {
        PersonRpcHandler personRpcHandler = new PersonRpcHandler(table);
        DeleteRecordRpcHandlerIF deleteRecordRpcHandler = new DeleteRecordRpcHandler();

        return new RpcHandlerBuilder()
                .addRpc("UpdateName", personRpcHandler::processUpdateNameRpcRequest)
                .addRpc("GetAccountId", personRpcHandler::processGetAccountIdRpcRequest)
                .addRpc("DeleteRecprd", deleteRecordRpcHandler::deleteRecord)
                .build();
    }

    // Example of a mixture of RPC handlers in scala and in java
    private RpcHandler buildRpcHandler2(DataTable table) {
        RpcHandler defaultHandler = new DefaultRpcHandlerImpl();
        PersonRpcHandler personRpcHandler = new PersonRpcHandler(table);
        DeleteRecordRpcHandlerIF deleteRecordRpcHandler = new DeleteRecordRpcHandler();
        defaultHandler.registerRpc("UpdateName", personRpcHandler::processUpdateNameRpcRequest);
        defaultHandler.registerRpc("GetAccountId", personRpcHandler::processGetAccountIdRpcRequest);
        defaultHandler.registerRpc("DeleteRecprd", deleteRecordRpcHandler::deleteRecord);
        return defaultHandler;
    }

    private RpcHandler buildRpcHandler3(TableContainer tableContainer) {
        return new EditPersonRecordRpcHandler(AllowAllRpcPermissionChecker$.MODULE$, tableContainer);
    }

    private RpcHandler buildImportRpcHandler(TableContainer tableContainer) {
        return new ImportRecordRpcHandler(tableContainer);
    }
}
