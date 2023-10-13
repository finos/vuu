package org.finos.vuu.layoutserver.dto;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.finos.vuu.layoutserver.model.ApplicationLayout;

@Data
@RequiredArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationLayoutDto {
    private String user;
    private JsonNode definition;

    public static ApplicationLayoutDto fromEntity(ApplicationLayout entity) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode definition = objectMapper.readTree(entity.extractDefinition());
        return new ApplicationLayoutDto(entity.getUsername(), definition);
    }
}
