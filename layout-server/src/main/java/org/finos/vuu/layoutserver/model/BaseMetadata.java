package org.finos.vuu.layoutserver.model;

import javax.persistence.Embeddable;
import javax.persistence.Lob;
import lombok.Data;

@Data
@Embeddable
public class BaseMetadata {

    private String name;
    private String group;

    @Lob
    private String screenshot;

    private String user;
}
