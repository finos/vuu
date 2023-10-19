package org.finos.vuu.layoutserver.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

@Data
public class ApplicationLayoutDto {
    private String username;
    private JsonNode definition;
}
