package org.finos.vuu.layoutserver.dto.response;

import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.Data;

import java.util.UUID;

@Data
public class LayoutResponseDto {

    private UUID id;
    
    /**
     * The definition of the layout as an arbitrary JSON structure, describing all required components
     */
    private ObjectNode definition;

    private MetadataResponseDto metadata;
}
