package org.finos.vuu.layoutserver.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.finos.vuu.layoutserver.dto.ApplicationLayoutDto;
import org.finos.vuu.layoutserver.model.ApplicationLayout;
import org.finos.vuu.layoutserver.repository.ApplicationLayoutRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.NoSuchElementException;
import java.util.Optional;

@RequiredArgsConstructor
@Service
public class ApplicationLayoutService {

    private static final Logger logger = LoggerFactory.getLogger(ApplicationLayoutService.class);
    private static ApplicationLayoutDto defaultLayout;
    private final ApplicationLayoutRepository repository;

    public void createApplicationLayout(String username, JsonNode layoutDefinition) {
        repository.save(new ApplicationLayout(username, layoutDefinition.toString()));
    }

    public ApplicationLayoutDto getApplicationLayout(String username) {
        Optional<ApplicationLayout> layout = repository.findById(username);

        if (layout.isEmpty()) {
            logger.info("No application layout for user, returning default");
            return getDefaultLayout();
        }

        try {
            return ApplicationLayoutDto.fromEntity(layout.get());
        } catch (JsonProcessingException e) {
            logger.warn("Failed to read user's application layout, returning default");
            return getDefaultLayout();
        }
    }

    public void updateApplicationLayout(String username, JsonNode layoutDefinition) {
        createApplicationLayout(username, layoutDefinition);
    }

    public void deleteApplicationLayout(String username) {
        try {
            repository.deleteById(username);
        } catch (EmptyResultDataAccessException e) {
            throw new NoSuchElementException("No layout found for user: " + username);
        }
    }

    private ApplicationLayoutDto getDefaultLayout() {
        if (defaultLayout == null) {
            loadDefaultLayout();
        }
        return defaultLayout;
    }

    private void loadDefaultLayout() {
        JsonNode definition = loadJsonFile();
        defaultLayout = ApplicationLayoutDto.builder().definition(definition).build();
    }

    private JsonNode loadJsonFile() {
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            ClassPathResource resource = new ClassPathResource("defaultLayout.json");
            return objectMapper.readTree(resource.getInputStream());
        } catch (IOException e) {
            logger.warn("Failed to read default application layout, returning empty node");
            return objectMapper.createObjectNode();
        }
    }
}
