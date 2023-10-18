package org.finos.vuu.layoutserver.controller;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.finos.vuu.layoutserver.dto.response.ApplicationLayoutDto;
import org.finos.vuu.layoutserver.service.ApplicationLayoutService;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("/application-layouts")
@Validated
public class ApplicationLayoutController {

    private final ApplicationLayoutService service;
    private final ModelMapper mapper;

    /**
     * Gets the application layout for the requesting user. Returns a default layout if none exists.
     *
     * @return the application layout
     */
    @ResponseStatus(HttpStatus.OK)
    @GetMapping
    public ApplicationLayoutDto getApplicationLayout(@RequestHeader("user") String username) {
        return mapper.map(service.getApplicationLayout(username), ApplicationLayoutDto.class);
    }

    /**
     * Creates a new application layout for the requesting user.
     *
     * @param layoutDefinition JSON representation of the application layout to be created
     * @param username         the user making the request
     */
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public void createApplicationLayout(@RequestHeader("user") String username, @RequestBody JsonNode layoutDefinition) {
        service.createApplicationLayout(username, layoutDefinition);
    }

    /**
     * Updates the application layout for the requesting user.
     *
     * @param layoutDefinition JSON representation of the application layout to be created
     * @param username         the user making the request
     */
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PutMapping
    public void updateApplicationLayout(@RequestHeader("user") String username, @RequestBody JsonNode layoutDefinition) {
        service.updateApplicationLayout(username, layoutDefinition);
    }

    /**
     * Deletes the application layout for the requesting user.
     *
     * @param username         the user making the request
     */
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping
    public void deleteApplicationLayout(@RequestHeader("user") String username) {
        service.deleteApplicationLayout(username);
    }
}
