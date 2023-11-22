package org.finos.vuu.layoutserver.dto.request;

import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class LayoutRequestDto {

    /**
     * The definition of the layout as an arbitrary JSON structure, describing all required components
     */
    @NotNull(message = "Definition must not be null")
    private ObjectNode definition;

    @NotNull(message = "Metadata must not be null")
    private MetadataRequestDto metadata;
}
