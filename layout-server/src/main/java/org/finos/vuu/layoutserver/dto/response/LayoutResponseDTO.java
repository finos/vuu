package org.finos.vuu.layoutserver.dto.response;

import lombok.Data;

import java.util.UUID;

@Data
public class LayoutResponseDTO {

    private UUID id;
    private String definition;
    private MetadataResponseDTO metadata;
}
