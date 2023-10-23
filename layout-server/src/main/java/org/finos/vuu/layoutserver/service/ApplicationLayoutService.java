package org.finos.vuu.layoutserver.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.finos.vuu.layoutserver.exceptions.InternalServerErrorException;
import org.finos.vuu.layoutserver.model.ApplicationLayout;
import org.finos.vuu.layoutserver.repository.ApplicationLayoutRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.NoSuchElementException;

@RequiredArgsConstructor
@Service
public class ApplicationLayoutService {

    private static final Logger logger = LoggerFactory.getLogger(ApplicationLayoutService.class);
    private static final String DEFAULT_LAYOUT_FILE = "defaultLayout.json";
    private static ApplicationLayout defaultLayout;
    private final ApplicationLayoutRepository repository;

    public void createApplicationLayout(String username, JsonNode layoutDefinition) {
        repository.save(new ApplicationLayout(username, layoutDefinition));
    }

    public ApplicationLayout getApplicationLayout(String username) {
        return repository.findById(username).orElseGet(() -> {
            logger.info("No application layout for user, returning default");
            return getDefaultLayout();
        });
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

    private ApplicationLayout getDefaultLayout() {
        if (defaultLayout == null) {
            loadDefaultLayout();
        }
        return defaultLayout;
    }

    private void loadDefaultLayout() {
        JsonNode definition = loadDefaultLayoutJsonFile();
        defaultLayout = new ApplicationLayout(null, definition);
    }

    private JsonNode loadDefaultLayoutJsonFile() {
        ObjectMapper objectMapper = new ObjectMapper();
        ClassPathResource resource = new ClassPathResource(DEFAULT_LAYOUT_FILE);
        try {
            return objectMapper.readTree(resource.getInputStream());
        } catch (IOException e) {
            throw new InternalServerErrorException("Failed to read default application layout");
        }
    }
}
