package org.finos.vuu.layoutserver.dto.response;

import lombok.Data;

import java.util.UUID;

@Data
public class LayoutResponseDTO {

    private UUID id;

    /**
     * The definition of the layout as a string (e.g. stringified JSON structure containing
     * components)
     */
    private String definition;

    private MetadataResponseDTO metadata;
}
