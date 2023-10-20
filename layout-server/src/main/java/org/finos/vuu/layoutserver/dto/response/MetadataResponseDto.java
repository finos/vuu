package org.finos.vuu.layoutserver.dto.response;

import lombok.Data;
import org.finos.vuu.layoutserver.dto.MetadataDto;

import java.util.Date;
import java.util.UUID;

@Data
public class MetadataResponseDto implements MetadataDto {

    private UUID layoutId;
    private String name;
    private String group;
    private String screenshot;
    private String user;
    private Date created;
    private Date updated;
}
