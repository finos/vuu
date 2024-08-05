package org.finos.vuu.person.datasource;

import org.finos.vuu.person.Person;

public class PersonStore {

    public Person[] GetAll() {
        return new Person[] {
                new Person("uniqueId1", "Adam", 56440),
                new Person("uniqueId2", "Natalie", 41687)
        };
    }
}
