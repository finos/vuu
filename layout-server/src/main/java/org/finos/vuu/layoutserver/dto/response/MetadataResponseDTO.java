package org.finos.vuu.layoutserver.dto.response;

import lombok.Data;

import java.util.Date;
import java.util.UUID;

@Data
public class MetadataResponseDTO {

    private UUID layoutId;
    private String name;
    private String group;
    private String screenshot;
    private String user;
    private Date created;
    private Date updated;
}
