package org.finos.vuu.person.auto;

import org.finos.vuu.person.Person;
import org.finos.vuu.util.schema.ExternalEntitySchema;
import org.finos.vuu.util.schema.ExternalEntitySchemaBuilder;

import java.util.List;

import static org.finos.vuu.util.ScalaCollectionConverter.toScala;

public class EntitySchema {

    public static ExternalEntitySchema person = ExternalEntitySchemaBuilder.apply()
            .withEntity(Person.class)
            .withIndex("ID_INDEX", toScala(List.of("id")))
            .build();
}
