package org.finos.vuu.person.auto;

import org.finos.vuu.core.table.DataTable;
import org.finos.vuu.core.table.RowWithData;
import org.finos.vuu.person.Person;
import org.finos.vuu.person.datasource.PersonStore;
import org.finos.vuu.provider.Provider;
import org.finos.vuu.util.schema.SchemaMapper;
import org.finos.vuu.util.schema.SchemaMapperBuilder;
import scala.collection.immutable.Map;
import scala.jdk.javaapi.OptionConverters;

import java.util.List;

import static org.finos.vuu.util.ScalaCollectionConverter.toScala;

public class AutoMappedPersonProvider implements Provider {

    private final DataTable table;
    private final PersonStore personStore;
    private final SchemaMapper schemaMapper;

    public AutoMappedPersonProvider(DataTable table, PersonStore personStore) {
        this.table = table;
        this.personStore = personStore;
        this.schemaMapper = SchemaMapperBuilder.apply(EntitySchema.person, table.getTableDef().getColumns())
                .build();
    }

    @Override
    public void doStart() {
        for (Person person : personStore.getAll()) {
            var rowMap = schemaMapper.toInternalRowMap(
                    toScala(List.of(person.id(), person.name(), person.accountNumber()))
            );
            var row = new RowWithData(getKeyValue(rowMap), rowMap);
            table.processUpdate(row.key(), row);
        }
    }

    private String getKeyValue(Map<String, Object> rowMap) {
        return OptionConverters.toJava(rowMap.get(table.getTableDef().keyField()))
                .map(Object::toString)
                .orElseThrow();
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
        return null;
    }

    @Override
    public void subscribe(String key) {

    }
}
