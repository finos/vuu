package org.finos.vuu.layoutserver.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import javax.validation.constraints.NotNull;
import lombok.Data;
import org.finos.vuu.layoutserver.dto.MetadataDTO;

@Data
public class MetadataRequestDTO implements MetadataDTO {

    @JsonProperty(value = "name", required = true)
    @NotNull(message = "Please provide a valid name")
    private String name;

    private String group;
    private String screenshot;
    private String user;
}
