package org.finos.vuu.layoutserver.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class LayoutRequestDto {

    @JsonProperty(value = "definition", required = true)
    @NotNull(message = "Definition must not be null")
    private ObjectNode definition;

    @JsonProperty(value = "metadata", required = true)
    @NotNull(message = "Metadata must not be null")
    private MetadataRequestDto metadata;
}
