package org.finos.vuu.layoutserver.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.finos.vuu.layoutserver.exceptions.InternalServerErrorException;
import org.finos.vuu.layoutserver.model.ApplicationLayout;
import org.springframework.context.annotation.Bean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class DefaultApplicationLayoutLoader {
    private static final String DEFAULT_LAYOUT_FILE = "defaultApplicationLayout.json";
    private static ApplicationLayout defaultLayout;

    @Bean
    public ApplicationLayout getDefaultLayout() {
        if (defaultLayout == null) {
            loadDefaultLayout();
        }
        return defaultLayout;
    }

    private void loadDefaultLayout() {
        ObjectNode definition = loadDefaultLayoutJsonFile();
        defaultLayout = new ApplicationLayout(null, definition, null);
    }

    private ObjectNode loadDefaultLayoutJsonFile() {
        ObjectMapper objectMapper = new ObjectMapper();
        ClassPathResource resource = new ClassPathResource(DEFAULT_LAYOUT_FILE);
        try {
            return objectMapper.readValue(resource.getInputStream(), ObjectNode.class);
        } catch (IOException e) {
            throw new InternalServerErrorException("Failed to read default application layout");
        }
    }
}
