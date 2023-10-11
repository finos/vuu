package org.finos.vuu.layoutserver.dto.request;

import lombok.Data;
import org.finos.vuu.layoutserver.dto.MetadataDTO;

@Data
public class MetadataRequestDTO implements MetadataDTO {

    private String name;
    private String group;
    private String screenshot;
    private String user;
}
