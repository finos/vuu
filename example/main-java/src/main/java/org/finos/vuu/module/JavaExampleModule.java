package org.finos.vuu.module;

import org.finos.toolbox.time.Clock;
import org.finos.vuu.api.ColumnBuilder;
import org.finos.vuu.api.TableDef;
import org.finos.vuu.api.ViewPortDef;
import org.finos.vuu.core.module.DefaultModule;
import org.finos.vuu.core.module.ModuleFactory;
import org.finos.vuu.core.module.TableDefContainer;
import org.finos.vuu.core.module.ViewServerModule;
import org.finos.vuu.core.table.Columns;
import org.finos.vuu.person.PersonRpcHandler;
import org.finos.vuu.person.datasource.PersonStore;
import org.finos.vuu.person.auto.AutoMappedPersonProvider;
import org.finos.vuu.person.auto.EntitySchema;
import org.finos.vuu.person.manual.PersonProvider;

import java.util.List;

import static org.finos.vuu.util.ScalaCollectionConverter.toScalaSeq;

public class JavaExampleModule extends DefaultModule {

    public static final String NAME = "JAVA_EXAMPLE";

    public ViewServerModule create(final TableDefContainer tableDefContainer, Clock clock) {

        return ModuleFactory.withNamespace(NAME, tableDefContainer)
                .addTable(TableDef.apply(
                                "PersonManualMapped",
                                "Id",
                                new ColumnBuilder()
                                        .addString("Id")
                                        .addString("Name")
                                        .addInt("Account")
                                        .build(),
                                toScalaSeq(List.of())
                        ),
                        (table, vs) -> new PersonProvider(table, new PersonStore()),
                        (table, provider, providerContainer, tableContainer) -> new ViewPortDef(
                                table.getTableDef().columns(),
                                new PersonRpcHandler(table, tableContainer)
                        )
                )
                .addTable(TableDef.apply(
                                "PersonAutoMapped",
                                "Id",
                                Columns.fromExternalSchema(EntitySchema.person),
                                toScalaSeq(List.of())
                        ),
                        (table, vs) -> new AutoMappedPersonProvider(table, new PersonStore(), clock)
                )
                .asModule();
    }

}
