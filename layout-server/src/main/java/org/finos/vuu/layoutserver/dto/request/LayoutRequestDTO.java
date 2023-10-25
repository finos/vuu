package org.finos.vuu.layoutserver.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LayoutRequestDTO {

    /**
     * The definition of the layout as a string (e.g. stringified JSON structure containing
     * components)
     */
    @JsonProperty(value = "definition", required = true)
    @NotBlank(message = "Definition must not be blank")
    private String definition;

    @JsonProperty(value = "metadata", required = true)
    @NotNull(message = "Metadata must not be null")
    private MetadataRequestDTO metadata;
}
