package org.finos.vuu.layoutserver.service;

import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.finos.vuu.layoutserver.model.ApplicationLayout;
import org.finos.vuu.layoutserver.repository.ApplicationLayoutRepository;
import org.finos.vuu.layoutserver.utils.DefaultApplicationLayoutLoader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;

@RequiredArgsConstructor
@Service
public class ApplicationLayoutService {

    private static final Logger logger = LoggerFactory.getLogger(ApplicationLayoutService.class);
    private final ApplicationLayoutRepository repository;
    private final DefaultApplicationLayoutLoader defaultLoader;

    public void persistApplicationLayout(String username, ObjectNode applicationLayout) {
        repository.save(new ApplicationLayout(username, applicationLayout));
    }

    public ApplicationLayout getApplicationLayout(String username) {
        return repository.findById(username).orElseGet(() -> {
            logger.info("No application layout for user, returning default");
            return defaultLoader.getDefaultLayout();
        });
    }

    public void deleteApplicationLayout(String username) {
        try {
            repository.deleteById(username);
        } catch (EmptyResultDataAccessException e) {
            throw new NoSuchElementException("No layout found for user: " + username);
        }
    }
}
