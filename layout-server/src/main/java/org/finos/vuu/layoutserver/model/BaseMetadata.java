package org.finos.vuu.layoutserver.model;

import javax.persistence.Embeddable;
import javax.persistence.Lob;
import javax.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Embeddable
public class BaseMetadata {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Group is required")
    private String group;

    @Lob
    private String screenshot;

    @NotBlank(message = "User is required")
    private String user;
}
