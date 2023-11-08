package org.finos.vuu.layoutserver.model;

import lombok.Data;

import javax.persistence.Embeddable;
import javax.persistence.Lob;

@Data
@Embeddable
public class BaseMetadata {

    private String name;
    private String group;

    @Lob
    private String screenshot;

    private String user;
}
