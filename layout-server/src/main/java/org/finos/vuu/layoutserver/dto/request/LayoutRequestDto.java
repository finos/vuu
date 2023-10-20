package org.finos.vuu.layoutserver.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
public class LayoutRequestDto {

    /**
     * The definition of the layout as a string (e.g. stringified JSON structure containing
     * components)
     */
    @JsonProperty(value = "definition", required = true)
    @NotBlank(message = "Please provide a valid definition")
    private String definition;

    @JsonProperty(value = "metadata", required = true)
    @NotNull(message = "Please provide valid metadata")
    private MetadataRequestDto metadata;
}
