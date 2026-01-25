package org.finos.vuu.person.manual;

import org.finos.vuu.core.table.DataTable;
import org.finos.vuu.person.Person;
import org.finos.vuu.person.datasource.PersonStore;
import org.finos.vuu.provider.Provider;

public class PersonProvider implements Provider {

    private final DataTable table;
    private final PersonStore personStore;

    public PersonProvider(final DataTable table, PersonStore personStore){
        this.table = table;
        this.personStore = personStore;
    }

    @Override
    public void doStart() {
        var rowBuilder = table.rowBuilder();
        var idColumn = table.columnForName("id");
        var nameColumn = table.columnForName("name");
        var accountColumn = table.columnForName("account");
        for (Person person : personStore.getAll()) {
            rowBuilder.setKey(person.id());
            rowBuilder.setString(idColumn, person.id());
            rowBuilder.setString(nameColumn, person.name());
            rowBuilder.setInt(accountColumn, person.accountNumber());
            table.processUpdate(rowBuilder.build());
        }
    }

    @Override
    public void doStop() {

    }

    @Override
    public void doInitialize() {

    }

    @Override
    public void doDestroy() {

    }

    @Override
    public String lifecycleId() {
        return "PersonProvider";
    }

    @Override
    public String toString() {
        return Provider.super.toString();
    }

    @Override
    public void subscribe(String key) {

    }
}
