package org.finos.vuu.layoutserver.dto.response;

import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.Data;

import java.util.UUID;

@Data
public class LayoutResponseDto {

    private UUID id;
    private ObjectNode definition;

    private MetadataResponseDto metadata;
}
