package org.finos.vuu.layoutserver.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.persistence.AttributeConverter;
import javax.persistence.Converter;
import java.io.IOException;

@Converter
public class ObjectNodeConverter implements AttributeConverter<ObjectNode, String> {
    private static final Logger logger = LoggerFactory.getLogger(ObjectNodeConverter.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(ObjectNode definition) {
        try {
            return objectMapper.writeValueAsString(definition);
        } catch (final JsonProcessingException e) {
            logger.error("JSON writing error", e);
            return null;
        }
    }

    @Override
    public ObjectNode convertToEntityAttribute(String definition) {
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
