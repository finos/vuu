package org.finos.vuu.layoutserver.dto.response;

import java.util.Date;
import java.util.UUID;
import lombok.Data;
import org.finos.vuu.layoutserver.dto.MetadataDTO;

@Data
public class MetadataResponseDTO implements MetadataDTO {

    private UUID layoutId;
    private String name;
    private String group;
    private String screenshot;
    private String user;
    private Date created;
    private Date updated;
}
