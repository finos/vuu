package org.finos.vuu.module;

import org.finos.toolbox.time.Clock;
import org.finos.vuu.api.ColumnBuilder;
import org.finos.vuu.api.TableDef;
import org.finos.vuu.core.module.DefaultModule;
import org.finos.vuu.core.module.ModuleFactory;
import org.finos.vuu.core.module.TableDefContainer;
import org.finos.vuu.core.module.ViewServerModule;
import org.finos.vuu.person.PersonProvider;
import org.finos.vuu.person.PersonStore;

import java.util.List;

import static org.finos.vuu.util.ScalaCollectionConverter.toScalaSeq;

public class JavaExampleModule extends DefaultModule {

    public static final String NAME = "JAVA_EXAMPLE";

    public ViewServerModule create(final TableDefContainer tableDefContainer, Clock clock) {
        return ModuleFactory.withNamespace(NAME, tableDefContainer)
                .addTable(TableDef.apply(
                                "Person",
                                "id",
                                new ColumnBuilder()
                                        .addString("Id")
                                        .addString("Name")
                                        .addInt("Account")
                                        .build(),
                                toScalaSeq(List.of())
                        ),
                        (table, vs) -> new PersonProvider(table, new PersonStore(), clock)
                ).asModule();
    }

}
