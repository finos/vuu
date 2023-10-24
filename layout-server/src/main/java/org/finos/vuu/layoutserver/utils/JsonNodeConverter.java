package org.finos.vuu.layoutserver.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.persistence.AttributeConverter;
import java.io.IOException;

public class JsonNodeConverter implements AttributeConverter<JsonNode, String> {
    private static final Logger logger = LoggerFactory.getLogger(JsonNodeConverter.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(JsonNode definition) {
        try {
            return objectMapper.writeValueAsString(definition);
        } catch (final JsonProcessingException e) {
            logger.error("JSON writing error", e);
            return null;
        }
    }

    @Override
    public JsonNode convertToEntityAttribute(String definition) {
        try {
            return objectMapper.readValue(extractDefinition(definition), new TypeReference<>() {});
        } catch (final IOException e) {
            logger.error("JSON reading error", e);
            return null;
        }
    }

    private String extractDefinition(String definition) {
        if (definition.startsWith("\"") && definition.endsWith("\"")) {
            definition = definition.substring(1, definition.length() - 1);
        }
        return definition.replaceAll("\\\\", "");
    }
}
