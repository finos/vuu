package org.finos.vuu.module;

import org.finos.toolbox.time.Clock;
import org.finos.vuu.api.ColumnBuilder;
import org.finos.vuu.api.ViewPortDef;
import org.finos.vuu.core.module.DefaultModule;
import org.finos.vuu.core.module.ModuleFactory;
import org.finos.vuu.core.module.TableDefContainer;
import org.finos.vuu.core.module.ViewServerModule;
import org.finos.vuu.core.table.Columns;
import org.finos.vuu.core.table.DefaultColumn;
import org.finos.vuu.person.PersonRpcHandler;
import org.finos.vuu.person.auto.AutoMappedPersonProvider;
import org.finos.vuu.person.auto.EntitySchema;
import org.finos.vuu.person.datasource.PersonStore;
import org.finos.vuu.person.manual.PersonProvider;
import org.finos.vuu.util.SortSpecBuilder;
import org.finos.vuu.util.TableDefBuilder;

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
                                new PersonRpcHandler(table, tableContainer)
                        )
                )
                .addTable(new TableDefBuilder()
                                .name("PersonAutoMapped")
                                .keyField("id")
                                .customColumns(Columns.fromExternalSchema(EntitySchema.person))
                                .build(),
                        (table, vs) -> new AutoMappedPersonProvider(table, new PersonStore())
                )
                .asModule();
    }

}
