package org.finos.vuu.person;

import java.io.Serializable;

public class UpdateNameRequestParam implements Serializable {
    private String id;
    private String name;

    public UpdateNameRequestParam(String id, String name){
        this.id = id;
        this.name = name;
    }

    public String Id() {return id;}
    public String Name() {return name;}
}