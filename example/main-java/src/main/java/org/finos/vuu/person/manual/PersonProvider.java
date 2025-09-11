package org.finos.vuu.person.manual;

import org.finos.vuu.core.table.DataTable;
import org.finos.vuu.core.table.RowWithData;
import org.finos.vuu.person.Person;
import org.finos.vuu.person.datasource.PersonStore;
import org.finos.vuu.provider.Provider;

import java.util.Map;

public class PersonProvider implements Provider {

    private final DataTable table;
    private final PersonStore personStore;

    public PersonProvider(final DataTable table, PersonStore personStore){
        this.table = table;
        this.personStore = personStore;
    }

    @Override
    public void doStart() {

        for (Person person : personStore.GetAll()) {
            var row = new RowWithData(person.Id, Map.of( "Id", person.Id, "Name", person.Name, "Account", person.AccountNumber));
            table.processUpdate(person.Id, row);
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
