package org.finos.vuu.layoutserver.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.finos.vuu.layoutserver.dto.MetadataDto;

import javax.validation.constraints.NotNull;

@Data
public class MetadataRequestDto implements MetadataDto {

    @JsonProperty(value = "name", required = true)
    @NotNull(message = "Please provide a valid name")
    private String name;

    private String group;
    private String screenshot;
    private String user;
}
